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

describe(DbInterface.prototype.findObjectAndUpdate.name, () => {
	test("Updates the object if it is found", async () => {
		const db = await getDb();

		const user = { _id: new ObjectId(), name: "Test User" };

		await db.addObject(CollectionId.Users, user);

		const updatedUser = { ...user, name: "Updated User" };
		const added = await db.findObjectAndUpdate(
			CollectionId.Users,
			user._id as any as ObjectId,
			updatedUser,
		);

		expect(db.countObjects(CollectionId.Users, {})).resolves.toBe(1);
		expect(
			db.findObjectById(CollectionId.Users, added!._id as any as ObjectId),
		).resolves.toStrictEqual(updatedUser);
	});

	test("Returns the updated object if it is found", async () => {
		const db = await getDb();

		const user = { _id: new ObjectId(), name: "Test User" };
		await db.addObject(CollectionId.Users, user);

		const updatedUser = { ...user, name: "Updated User" };
		const added = await db.findObjectAndUpdate(
			CollectionId.Users,
			user._id as any as ObjectId,
			updatedUser,
		);

		expect(added).toStrictEqual({
			_id: added!._id,
			name: "Updated User",
		});
	});

	test("Returns undefined if the object is not found", async () => {
		const db = await getDb();

		const user = { _id: new ObjectId(), name: "Test User" };
		await db.addObject(CollectionId.Users, user);

		const updatedUser = { ...user, name: "Updated User" };
		const added = await db.findObjectAndUpdate(
			CollectionId.Users,
			new ObjectId(),
			updatedUser,
		);

		expect(added).toBeUndefined();
	});
});

describe(DbInterface.prototype.deleteObjects.name, () => {
	test("Deletes an object if one object is found", async () => {
		const db = await getDb();

		const user = { _id: new ObjectId(), name: "Test User" };
		await db.addObject(CollectionId.Users, user);

		await db.deleteObjects(CollectionId.Users, { _id: user._id });

		expect(db.countObjects(CollectionId.Users, {})).resolves.toBe(0);
	});

	test("Does not delete objects if none are not found", async () => {
		const db = await getDb();

		const user = { _id: new ObjectId(), name: "Test User" };
		await db.addObject(CollectionId.Users, user);

		await db.deleteObjects(CollectionId.Users, { name: "Not Test User" });

		expect(db.countObjects(CollectionId.Users, {})).resolves.toBe(1);
	});

	test("Deletes multiple objects if multiple objects are found", async () => {
		const db = await getDb();

		const user1 = { _id: new ObjectId(), name: "Test User" };
		const user2 = { _id: new ObjectId(), name: "Test User" };
		await db.addObject(CollectionId.Users, user1);
		await db.addObject(CollectionId.Users, user2);

		await db.deleteObjects(CollectionId.Users, { name: "Test User" });

		expect(db.countObjects(CollectionId.Users, {})).resolves.toBe(0);
	});

	test("Does not delete objects if none are found", async () => {
		const db = await getDb();

		const user1 = { _id: new ObjectId(), name: "Test User" };
		const user2 = { _id: new ObjectId(), name: "Test User" };
		await db.addObject(CollectionId.Users, user1);
		await db.addObject(CollectionId.Users, user2);

		await db.deleteObjects(CollectionId.Users, { name: "Not Test User" });

		expect(db.countObjects(CollectionId.Users, {})).resolves.toBe(2);
	});

	test("Deletes only the objects that match the query", async () => {
		const db = await getDb();

		const user1 = { _id: new ObjectId(), name: "Test User" };
		const user2 = { _id: new ObjectId(), name: "Test User" };
		await db.addObject(CollectionId.Users, user1);
		await db.addObject(CollectionId.Users, user2);

		await db.deleteObjects(CollectionId.Users, { _id: user1._id });

		expect(db.countObjects(CollectionId.Users, {})).resolves.toBe(1);
		expect(
			db.findObjectById(CollectionId.Users, user1._id as any as ObjectId),
		).resolves.toBeUndefined();
		expect(
			db.findObjectById(CollectionId.Users, user2._id as any as ObjectId),
		).resolves.toStrictEqual(user2);
	});

	test("Deletes all objects if the query is empty", async () => {
		const db = await getDb();

		const user1 = { _id: new ObjectId(), name: "Test User" };
		const user2 = { _id: new ObjectId(), name: "Test User" };
		await db.addObject(CollectionId.Users, user1);
		await db.addObject(CollectionId.Users, user2);

		await db.deleteObjects(CollectionId.Users, {});

		expect(db.countObjects(CollectionId.Users, {})).resolves.toBe(0);
	});
});

describe(DbInterface.prototype.findObjectAndDelete.name, () => {
	test("Deletes an object if one object is found", async () => {
		const db = await getDb();

		const user = { _id: new ObjectId(), name: "Test User" };
		await db.addObject(CollectionId.Users, user);

		const deleted = await db.findObjectAndDelete(CollectionId.Users, {
			_id: user._id,
		});

		expect(deleted).toStrictEqual(user);
		expect(db.countObjects(CollectionId.Users, {})).resolves.toBe(0);
	});

	test("Returns undefined if no object is found", async () => {
		const db = await getDb();

		const user = { _id: new ObjectId(), name: "Test User" };
		await db.addObject(CollectionId.Users, user);

		const deleted = await db.findObjectAndDelete(CollectionId.Users, {
			name: "Not Test User",
		});

		expect(deleted).toBeUndefined();
		expect(db.countObjects(CollectionId.Users, {})).resolves.toBe(1);
	});

	test("Returns the deleted object if one object is found", async () => {
		const db = await getDb();

		const user = { _id: new ObjectId(), name: "Test User" };
		await db.addObject(CollectionId.Users, user);

		const deleted = await db.findObjectAndDelete(CollectionId.Users, {
			_id: user._id,
		});

		expect(deleted).toStrictEqual(user);
		expect(db.countObjects(CollectionId.Users, {})).resolves.toBe(0);
	});

	test("Only deletes one object if multiple objects are found", async () => {
		const db = await getDb();

		const user1 = { _id: new ObjectId(), name: "Test User" };
		const user2 = { _id: new ObjectId(), name: "Test User" };

		await db.addObject(CollectionId.Users, user1);
		await db.addObject(CollectionId.Users, user2);

		const deleted = await db.findObjectAndDelete(CollectionId.Users, {
			name: "Test User",
		});

		expect(deleted).toStrictEqual(user1);
		expect(db.countObjects(CollectionId.Users, {})).resolves.toBe(1);
		expect(
			db.findObjectById(CollectionId.Users, user1._id as any as ObjectId),
		).resolves.toBeUndefined();
		expect(
			db.findObjectById(CollectionId.Users, user2._id as any as ObjectId),
		).resolves.toStrictEqual(user2);
	});
});

describe(DbInterface.prototype.addMultipleObjects.name, () => {
	test("Adds multiple objects", async () => {
		const db = await getDb();

		const users = [
			{ _id: new ObjectId(), name: "Test User 1" },
			{ _id: new ObjectId(), name: "Test User 2" },
		];

		await db.addMultipleObjects(CollectionId.Users, users);

		expect(db.countObjects(CollectionId.Users, {})).resolves.toBe(2);
		expect(
			db.findObjectById(CollectionId.Users, users[0]._id as any as ObjectId),
		).resolves.toStrictEqual(users[0]);
		expect(
			db.findObjectById(CollectionId.Users, users[1]._id as any as ObjectId),
		).resolves.toStrictEqual(users[1]);
	});

	test("Adds objects without _ids", async () => {
		const db = await getDb();

		const users = [{ name: "Test User 1" }, { name: "Test User 2" }];

		await db.addMultipleObjects(CollectionId.Users, users);

		expect(db.countObjects(CollectionId.Users, {})).resolves.toBe(2);
	});

	test("Returns objects with _ids if objects do not originally have _ids", async () => {
		const db = await getDb();

		const users = [{ name: "Test User 1" }, { name: "Test User 2" }];

		const added = await db.addMultipleObjects(CollectionId.Users, users);

		expect(added[0]).toHaveProperty("_id");
		expect(added[1]).toHaveProperty("_id");
		expect(added[0]._id).not.toEqual(added[1]._id);
	});

	test("Returns objects with orginal _ids if objects originally have _ids", async () => {
		const db = await getDb();

		const users = [
			{ _id: new ObjectId(), name: "Test User 1" },
			{ _id: new ObjectId(), name: "Test User 2" },
		];

		const added = await db.addMultipleObjects(CollectionId.Users, users);

		expect(added[0]._id).toEqual(users[0]._id);
		expect(added[1]._id).toEqual(users[1]._id);
	});
});
