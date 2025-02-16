import { MongoClient, Db, ObjectId } from "mongodb";
import DbInterface, { WithStringOrObjectIdId } from "./DbInterface";
import { ensureObjHasId } from "./utils";

export default class MongoDbInterface<
	TCollectionId extends string,
	TDocument extends WithStringOrObjectIdId<Document>,
> implements DbInterface<TCollectionId, TDocument>
{
	promise: Promise<MongoClient> | undefined;
	client: MongoClient | undefined;
	db: Db | undefined;

	constructor(promise: Promise<MongoClient>) {
		this.promise = promise;
	}

	async init(collectionIds: TCollectionId[]) {
		this.client = await this.promise;
		this.db = this.client?.db(process.env.DB);

		try {
			collectionIds.forEach(
				async (collectionName) =>
					await this.db?.createCollection(collectionName),
			);
		} catch (e) {
			console.error(e);
		}
	}

	async addObject<TId extends TCollectionId, TObj extends TDocument>(
		collection: TId,
		object: WithStringOrObjectIdId<TObj>,
	): Promise<TObj> {
		ensureObjHasId(object);

		const ack = await this?.db
			?.collection(collection)
			.insertOne(object as Document & { _id?: ObjectId });
		object._id = ack?.insertedId;
		return object as TObj;
	}

	async deleteObjectById(collection: TCollectionId, id: ObjectId) {
		var query = { _id: id };
		await this?.db?.collection(collection).deleteOne(query);
	}

	updateObjectById<TId extends TCollectionId, TObj extends TDocument>(
		collection: TId,
		id: ObjectId,
		newValues: Partial<TObj>,
	): Promise<void> {
		var query = { _id: id };
		var updated = { $set: newValues };
		this?.db?.collection(collection).updateOne(query, updated);

		return Promise.resolve();
	}

	async findObjectById<Type>(
		collection: TCollectionId,
		id: ObjectId,
	): Promise<Type> {
		return (await this?.db
			?.collection(collection)
			.findOne({ _id: id })) as Type;
	}

	async findObject<Type>(
		collection: TCollectionId,
		query: object,
	): Promise<Type> {
		return (await this?.db?.collection(collection).findOne(query)) as Type;
	}

	async findObjects<Type>(
		collection: TCollectionId,
		query: object,
	): Promise<Type[]> {
		return (await this?.db
			?.collection(collection)
			.find(query)
			.toArray()) as Type[];
	}

	async countObjects(
		collection: TCollectionId,
		query: object,
	): Promise<number | undefined> {
		return await this?.db?.collection(collection).countDocuments(query);
	}
}
