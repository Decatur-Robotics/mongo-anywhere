import { ObjectId, Document } from "bson";

export type WithStringOrObjectIdId<Type> = Omit<Type, "_id"> & {
	_id?: ObjectId | string;
};

export default abstract class DbInterface<
	TCollectionId extends string,
	TDocument extends WithStringOrObjectIdId<Document>,
> {
	abstract init(collectionIds: TCollectionId[]): Promise<void>;

	abstract addObject<TId extends TCollectionId, TObj extends TDocument>(
		collection: TId,
		object: WithStringOrObjectIdId<TObj>,
	): Promise<TObj>;

	abstract deleteObjectById(
		collection: TCollectionId,
		id: ObjectId,
	): Promise<void>;

	abstract updateObjectById<TId extends TCollectionId, TObj extends TDocument>(
		collection: TId,
		id: ObjectId,
		newValues: Partial<TObj>,
	): Promise<void>;

	abstract findObjectById<Type extends Document>(
		collection: TCollectionId,
		id: ObjectId,
	): Promise<Type | undefined>;

	abstract findObject<Type extends Document>(
		collection: TCollectionId,
		query: object,
	): Promise<Type | undefined>;

	/**
	 * Type should not be an array! This function returns an array of Type (Type[]).
	 */
	abstract findObjects<Type extends Document>(
		collection: TCollectionId,
		query: object,
	): Promise<Type[]>;

	abstract countObjects(
		collection: TCollectionId,
		query: object,
	): Promise<number | undefined>;

	/**
	 * If the object is already in the database, it will be updated; the updated version will be returned.
	 * If the object is not in the database, it will be added and returned.
	 */
	async addOrUpdateObject<TId extends TCollectionId, TObj extends TDocument>(
		collection: TId,
		object: WithStringOrObjectIdId<TObj>,
	): Promise<TObj> {
		if (object._id) {
			const existing = await this.findObjectById<TObj>(
				collection,
				new ObjectId(object._id),
			);

			if (!existing) {
				return this.addObject(collection, object);
			}

			await this.updateObjectById<TId, TObj>(
				collection,
				new ObjectId(object._id),
				object as any,
			);

			return {
				...existing,
				...object,
			} as TObj;
		}

		return this.addObject(collection, object);
	}
}
