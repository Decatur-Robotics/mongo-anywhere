import { ObjectId, Document } from "bson";

export type WithStringOrObjectIdId<Type> = Omit<Type, "_id"> & {
	_id?: ObjectId | string;
};

export default interface DbInterface<
	TCollectionId extends string,
	TDocument extends WithStringOrObjectIdId<Document>,
> {
	init(): Promise<void>;

	addObject<TId extends TCollectionId, TObj extends TDocument>(
		collection: TId,
		object: WithStringOrObjectIdId<TObj>,
	): Promise<TObj>;

	deleteObjectById(
		collection: TCollectionId,
		id: ObjectId,
	): Promise<void>;

	updateObjectById<TId extends TCollectionId, TObj extends TDocument>(
		collection: TId,
		id: ObjectId,
		newValues: Partial<TObj>,
	): Promise<void>;

	findObjectById<Type extends Document>(
		collection: TCollectionId,
		id: ObjectId,
	): Promise<Type | undefined>;

	findObject<Type extends Document>(
		collection: TCollectionId,
		query: object,
	): Promise<Type | undefined>;

	/**
	 * Type should not be an array! This function returns an array of Type (Type[]).
	 */
	findObjects<Type extends Document>(
		collection: TCollectionId,
		query: object,
	): Promise<Type[]>;

	countObjects(
		collection: TCollectionId,
		query: object,
	): Promise<number | undefined>;
}
