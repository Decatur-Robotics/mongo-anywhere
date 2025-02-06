import { Document, ObjectId } from "bson";
import DbInterface, { WithStringOrObjectIdId } from "./DbInterface";
import { LocalStorageDb, MinimongoLocalCollection } from "minimongo";
import { deserialize, serialize } from "./utils";

/**
 * @tested_by tests/LocalStorageDbInterface.test.ts
 */
export default class LocalStorageDbInterface<
	TCollectionId extends string,
	TDocument extends WithStringOrObjectIdId<Document>,
> implements DbInterface<TCollectionId, TDocument>
{
	backingDb: LocalStorageDb;

	constructor() {
		this.backingDb = new LocalStorageDb(
			{ namespace: "localstoragedb" },
			undefined,
			console.error,
		);
	}

	init(collectionIds: string[]): Promise<void> {
		const promise = new Promise((resolve) => {
			let collectionsCreated = 0;

			function onCollectionCreated() {
				collectionsCreated++;
				if (collectionsCreated === collectionIds.length) {
					resolve(undefined);
				}
			}

			// Have to use Object.values here or else we'll get the keys as strings
			// Be sure to use of, not in!
			for (const collectionId of collectionIds) {
				this.backingDb.addCollection(
					collectionId,
					onCollectionCreated,
					(e: any) => {
						throw new Error(e);
					},
				);
			}
		});

		return promise as Promise<void>;
	}

	private cacheObj(
		collectionId: TCollectionId,
		obj: WithStringOrObjectIdId<TDocument>,
		then: () => void,
	) {
		return Promise.resolve(
			(
				this.backingDb.collections[collectionId] as MinimongoLocalCollection
			).cacheOne(obj, then, (e: any) => {
				throw new Error(e);
			}),
		);
	}

	protected getCollection(collection: TCollectionId) {
		if (!this.backingDb.collections[collection]) {
			this.backingDb.addCollection(collection, undefined, (e: any) => {
				throw new Error(e);
			});
		}

		return this.backingDb.collections[collection];
	}

	addObject<TId extends TCollectionId, TObj extends TDocument>(
		collection: TId,
		object: WithStringOrObjectIdId<TObj>,
	): Promise<TObj> {
		if (!object._id) object._id = new ObjectId();

		return this.cacheObj(collection, object, () => {
			return this.getCollection(collection)
				.upsert(serialize(object))
				.then(deserialize);
		}).then(() => object as TObj);
	}

	deleteObjectById(collection: TCollectionId, id: ObjectId): Promise<void> {
		return this.getCollection(collection).remove(serialize({ _id: id }));
	}

	updateObjectById<TId extends TCollectionId, TObj extends TDocument>(
		collection: TId,
		id: ObjectId,
		newValues: Partial<TObj>,
	): Promise<void> {
		return this.getCollection(collection)
			.findOne(serialize({ _id: id }))
			.then((existingDoc) => {
				if (!existingDoc) {
					throw new Error(
						`Document with id ${id} not found in collection ${collection}`,
					);
				}

				const returnValue = this.getCollection(collection).upsert(
					serialize({ ...existingDoc, ...newValues, _id: id }),
				);
				return deserialize(returnValue);
			});
	}

	findObjectById<Type extends Document>(
		collection: TCollectionId,
		id: ObjectId,
	): Promise<Type | undefined> {
		return this.findObject(collection, { _id: id });
	}

	findObject<Type extends Document>(
		collection: TCollectionId,
		query: object,
	): Promise<Type | undefined> {
		return this.getCollection(collection)
			.findOne(serialize(query, false))
			.then(deserialize)
			.then((obj: Type) => {
				if (Object.keys(obj).length === 0) {
					return undefined;
				}

				return obj;
			});
	}

	findObjects<Type extends Document>(
		collection: TCollectionId,
		query: object,
	): Promise<Type[]> {
		return this.getCollection(collection)
			.find(serialize(query, false))
			.fetch()
			.then((res: any) => {
				return Object.values(res).map(deserialize);
			});
	}

	countObjects(
		collection: TCollectionId,
		query: object,
	): Promise<number | undefined> {
		return (
			this.getCollection(collection)
				.find(serialize(query, false))
				.fetch() as Promise<unknown>
		).then((objects) => {
			return Object.keys(objects as any).length;
		});
	}
}
