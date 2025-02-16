import { ObjectId, Document } from "bson";
import DbInterface, { WithStringOrObjectIdId } from "./DbInterface";
import NodeCache from "node-cache";
import { ensureObjHasId } from "./utils";

declare global {
	var cache: NodeCache | undefined;
}

export function getCacheKey(
	operation: "findOne" | "findMultiple" | "count",
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
	) {}

	init(collectionIds: TCollectionId[]): Promise<void> {
		this.fallbackDb.init(collectionIds);

		if (!global.cache) {
			global.cache = new NodeCache(this.cacheOptions);
		}

		return Promise.resolve();
	}

	addObject<TId extends TCollectionId, TObj extends TDocument>(
		collection: TId,
		object: WithStringOrObjectIdId<TObj>,
	): Promise<TObj> {
		ensureObjHasId(object);

		global.cache!.set(
			getCacheKey("findOne", collection, object._id!.toString()),
			object,
		);

		return this.fallbackDb.addObject(collection, object);
	}

	deleteObjectById(collection: TCollectionId, id: ObjectId): Promise<void> {
		global.cache!.del(getCacheKey("findOne", collection, id.toString()));

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

			global.cache!.set(
				getCacheKey("findOne", collection, id.toString()),
				updated,
			);
		}

		return this.fallbackDb.updateObjectById(collection, id, newValues);
	}

	async findObjectById<Type extends Document>(
		collection: TCollectionId,
		id: ObjectId,
	): Promise<Type | undefined> {
		const cached = global.cache!.get(
			getCacheKey("findOne", collection, id.toString()),
		);

		if (cached) {
			return Promise.resolve(cached as Type);
		}

		const fallback = await this.fallbackDb.findObjectById(collection, id);
		if (fallback) {
			global.cache!.set(
				getCacheKey("findOne", collection, id.toString()),
				fallback,
			);
		}

		return fallback as Type;
	}

	async findObject<Type extends Document>(
		collection: TCollectionId,
		query: object,
	): Promise<Type | undefined> {
		const cached = global.cache!.get(getCacheKey("findOne", collection, query));

		if (cached) {
			return Promise.resolve(cached as Type);
		}

		const fallback = await this.fallbackDb.findObject(collection, query);
		if (fallback) {
			global.cache!.set(getCacheKey("findOne", collection, query), fallback);
		}

		return fallback as Type;
	}

	async findObjects<Type extends Document>(
		collection: TCollectionId,
		query: object,
	): Promise<Type[]> {
		const cachedIds = global.cache!.get(
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
			global.cache!.set(
				getCacheKey("findMultiple", collection, query),
				fallback.map((obj) => obj._id!),
			);

			fallback.forEach((obj) => {
				global.cache!.set(
					getCacheKey("findOne", collection, obj._id!.toString()),
					obj,
				);
			});
		}

		return fallback as Type[];
	}

	async countObjects(
		collection: TCollectionId,
		query: object,
	): Promise<number | undefined> {
		const cached = global.cache!.get(getCacheKey("count", collection, query));

		if (cached) {
			return Promise.resolve(cached as number);
		}

		const fallback = await this.fallbackDb.countObjects(collection, query);
		if (fallback) {
			global.cache!.set(getCacheKey("count", collection, query), fallback);
		}

		return fallback;
	}
}
