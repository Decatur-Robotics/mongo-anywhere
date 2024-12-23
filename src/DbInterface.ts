import { ObjectId, Document } from "bson";

export type WithStringOrObjectIdId<Type> = Omit<Type, "_id"> & {
	_id?: ObjectId | string;
};

export default abstract class DbInterface<
	TCollectionId extends string,
	TDocument extends WithStringOrObjectIdId<Document>,
> {
	init(): Promise<void> {
		return Promise.resolve();
	}

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
}