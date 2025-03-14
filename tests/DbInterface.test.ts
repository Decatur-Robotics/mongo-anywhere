import { ObjectId } from "bson";
import DbInterface from "../src/DbInterface";
import InMemoryDbInterface from "../src/InMemoryDbInterface";

enum CollectionId {
	Users = "Users",
}

async function getDb() {
	const db = new InMemoryDbInterface();
	await db.init(Object.values(CollectionId));
	return db;
}

describe(DbInterface.prototype.addOrUpdateObject.name, () => {
	test("Adds the object if it has no _id", async () => {
		const db = await getDb();

		const user = { name: "Test User" };
		const added = await db.addOrUpdateObject(CollectionId.Users, user);

		expect(db.countObjects(CollectionId.Users, {})).resolves.toBe(1);
		expect(
			await db.findObjectById(CollectionId.Users, added._id as any as ObjectId),
		).toStrictEqual(added);
	});

	test("Returns the object if it has no _id", async () => {
		const db = await getDb();

		const user = { name: "Test User" };
		const added = await db.addOrUpdateObject(CollectionId.Users, user);

		expect(added).toStrictEqual({
			_id: added._id,
			name: "Test User",
		});
	});

	test("Adds the object if it is not found", async () => {
		const db = await getDb();

		const user = { _id: new ObjectId(), name: "Test User" };
		const added = await db.addOrUpdateObject(CollectionId.Users, user);

		expect(db.countObjects(CollectionId.Users, {})).resolves.toBe(1);
		expect(
			await db.findObjectById(CollectionId.Users, added._id as any as ObjectId),
		).toStrictEqual(added);
	});

	test("Returns the updated object if it is not found", async () => {
		const db = await getDb();

		const user = { _id: new ObjectId(), name: "Test User" };
		const added = await db.addOrUpdateObject(CollectionId.Users, user);

		expect(added).toStrictEqual({
			_id: added._id,
			name: "Test User",
		});
	});

	test("Updates the object if it is found", async () => {
		const db = await getDb();

		const user = { _id: new ObjectId(), name: "Test User" };

		await db.addOrUpdateObject(CollectionId.Users, user);

		const updatedUser = { ...user, name: "Updated User" };
		const added = await db.addOrUpdateObject(CollectionId.Users, updatedUser);

		expect(db.countObjects(CollectionId.Users, {})).resolves.toBe(1);
		expect(
			db.findObjectById(CollectionId.Users, added._id as any as ObjectId),
		).resolves.toStrictEqual(updatedUser);
	});

	test("Returns the updated object if it is found", async () => {
		const db = await getDb();

		const user = { _id: new ObjectId(), name: "Test User" };

		await db.addOrUpdateObject(CollectionId.Users, user);

		const updatedUser = { ...user, name: "Updated User" };
		const added = await db.addOrUpdateObject(CollectionId.Users, updatedUser);

		expect(added).toStrictEqual({
			_id: added._id,
			name: "Updated User",
		});
	});
});
