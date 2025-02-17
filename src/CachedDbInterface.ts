import { ObjectId, Document } from "bson";
import DbInterface, { WithStringOrObjectIdId } from "./DbInterface";
import NodeCache from "node-cache";
import { ensureObjHasId } from "./utils";

declare global {
	var cache: NodeCache | undefined;
}

export type CacheOperation = "findOne" | "findMultiple" | "count";

export function getCacheKey(
	operation: CacheOperation,
	collection: string,
	query: object | string,
): string {
	return `${operation}.${collection}.${typeof query === "string" ? query : JSON.stringify(query)}`;
}

export default class CachedDbInterface<
	TCollectionId extends string,
	TDocument extends WithStringOrObjectIdId<Document>,
> implements DbInterface<TCollectionId, TDocument>
{
	/**
	 *
	 * @param fallbackDb the DbInterface to use as a fallback in the event of a cache miss
	 * @param cacheOptions options to pass to the NodeCache constructor
	 */
	constructor(
		private fallbackDb: DbInterface<TCollectionId, TDocument>,
		private cacheOptions: NodeCache.Options,
		private logCacheInteractions = false,
	) {}

	init(collectionIds: TCollectionId[]): Promise<void> {
		this.fallbackDb.init(collectionIds);

		if (!global.cache) {
			global.cache = new NodeCache(this.cacheOptions);
		}

		return Promise.resolve();
	}

	/**
	 * Override to make TTLs vary by collection
	 */
	protected getTtl(
		operation: CacheOperation,
		collection: TCollectionId,
	): number {
		return this.cacheOptions.stdTTL ?? 0;
	}

	private getFromCache(key: string) {
		const cached = global.cache!.get(key);

		if (this.logCacheInteractions) {
			console.log(`Cache ${cached ? "HIT" : "MISS"} for key: ${key}`);
		}

		return cached;
	}

	private setInCache(key: string, value: any, ttl: number) {
		global.cache!.set(key, value, ttl);

		if (this.logCacheInteractions) {
			console.log(`Set cache for key: ${key}`);
		}
	}

	private deleteFromCache(key: string) {
		global.cache!.del(key);

		if (this.logCacheInteractions) {
			console.log(`Deleted cache for key: ${key}`);
		}
	}

	addObject<TId extends TCollectionId, TObj extends TDocument>(
		collection: TId,
		object: WithStringOrObjectIdId<TObj>,
	): Promise<TObj> {
		ensureObjHasId(object);

		this.setInCache(
			getCacheKey("findOne", collection, object._id!.toString()),
			object,
			this.getTtl("findOne", collection),
		);

		return this.fallbackDb.addObject(collection, object);
	}

	deleteObjectById(collection: TCollectionId, id: ObjectId): Promise<void> {
		this.deleteFromCache(getCacheKey("findOne", collection, id.toString()));

		return this.fallbackDb.deleteObjectById(collection, id);
	}

	updateObjectById<TId extends TCollectionId, TObj extends TDocument>(
		collection: TId,
		id: ObjectId,
		newValues: Partial<TObj>,
	): Promise<void> {
		const cached = global.cache!.get(
			getCacheKey("findOne", collection, id.toString()),
		) as TObj | undefined;

		if (cached) {
			const updated = { ...cached, ...newValues };

			this.setInCache(
				getCacheKey("findOne", collection, id.toString()),
				updated,
				this.getTtl("findOne", collection),
			);
		}

		return this.fallbackDb.updateObjectById(collection, id, newValues);
	}

	async findObjectById<Type extends Document>(
		collection: TCollectionId,
		id: ObjectId,
	): Promise<Type | undefined> {
		const cached = this.getFromCache(
			getCacheKey("findOne", collection, id.toString()),
		);

		if (cached) {
			return Promise.resolve(cached as Type);
		}

		const fallback = await this.fallbackDb.findObjectById(collection, id);
		if (fallback) {
			this.setInCache(
				getCacheKey("findOne", collection, id.toString()),
				fallback,
				this.getTtl("findOne", collection),
			);
		}

		return fallback as Type;
	}

	async findObject<Type extends Document>(
		collection: TCollectionId,
		query: object,
	): Promise<Type | undefined> {
		const cached = this.getFromCache(getCacheKey("findOne", collection, query));

		if (cached) {
			return Promise.resolve(cached as Type);
		}

		const fallback = await this.fallbackDb.findObject(collection, query);
		if (fallback) {
			this.setInCache(
				getCacheKey("findOne", collection, query),
				fallback,
				this.getTtl("findOne", collection),
			);
		}

		return fallback as Type;
	}

	async findObjects<Type extends Document>(
		collection: TCollectionId,
		query: object,
	): Promise<Type[]> {
		const cachedIds = this.getFromCache(
			getCacheKey("findMultiple", collection, query),
		) as ObjectId[];

		if (cachedIds) {
			const promises = cachedIds.map(async (id) =>
				this.findObjectById(collection, id),
			);

			return Promise.all(promises) as Promise<Type[]>;
		}

		const fallback = await this.fallbackDb.findObjects(collection, query);

		if (fallback) {
			this.setInCache(
				getCacheKey("findMultiple", collection, query),
				fallback.map((obj) => obj._id!),
				this.getTtl("findMultiple", collection),
			);

			fallback.forEach((obj) => {
				this.setInCache(
					getCacheKey("findOne", collection, obj._id!.toString()),
					obj,
					this.getTtl("findOne", collection),
				);
			});
		}

		return fallback as Type[];
	}

	async countObjects(
		collection: TCollectionId,
		query: object,
	): Promise<number | undefined> {
		const cached = this.getFromCache(getCacheKey("count", collection, query));

		if (cached) {
			return Promise.resolve(cached as number);
		}

		const fallback = await this.fallbackDb.countObjects(collection, query);
		if (fallback) {
			this.setInCache(
				getCacheKey("count", collection, query),
				fallback,
				this.getTtl("count", collection),
			);
		}

		return fallback;
	}
}
