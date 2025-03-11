import InMemoryDbInterface from "../src/InMemoryDbInterface";
import { ObjectId } from "bson";

enum CollectionId {
	Users = "Users",
	Accounts = "Accounts",
}

type User = {
	_id: ObjectId;
	name: string;
};

async function getTestApiUtils() {
	const db = await getDb();
	const user = { _id: new ObjectId(), name: "Test User" };
	return { db, user };
}

async function getDb() {
	const db = new InMemoryDbInterface();
	await db.init(Object.values(CollectionId));
	return db;
}

test(`${InMemoryDbInterface.name}.${InMemoryDbInterface.prototype.init.name}: Initializes collections`, async () => {
	const db = new InMemoryDbInterface();
	await db.init(Object.values(CollectionId));
	expect(Object.keys(db.backingDb.collections)).toStrictEqual(
		Object.values(CollectionId),
	);
});

test(`${InMemoryDbInterface.name}.${InMemoryDbInterface.prototype.addObject.name}: Adds object`, async () => {
	const { db, user } = await getTestApiUtils();
	await db.addObject(CollectionId.Users, user);
	expect(await db.countObjects(CollectionId.Users, {})).toBe(1);
});

test(`${InMemoryDbInterface.name}.${InMemoryDbInterface.prototype.deleteObjectById.name}: Deletes object by id`, async () => {
	const { db, user } = await getTestApiUtils();
	await db.addObject(CollectionId.Users, user);

	await db.deleteObjectById(CollectionId.Users, user._id as any as ObjectId);
	expect(await db.countObjects(CollectionId.Users, {})).toBe(0);
});

test(`${InMemoryDbInterface.name}.${InMemoryDbInterface.prototype.updateObjectById.name}: Updates object`, async () => {
	const { db, user } = await getTestApiUtils();
	await db.addObject(CollectionId.Users, user);

	const updated = { name: "Updated User" };
	await db.updateObjectById(
		CollectionId.Users,
		user._id as any as ObjectId,
		updated,
	);

	expect(
		await db.findObjectById(CollectionId.Users, user._id as any as ObjectId),
	).toStrictEqual({ ...user, ...updated });
});

test(`${InMemoryDbInterface.name}.${InMemoryDbInterface.prototype.findObjectById.name}: Finds object by id`, async () => {
	const { db, user } = await getTestApiUtils();
	await db.addObject(CollectionId.Users, user);

	expect(
		await db.findObjectById(CollectionId.Users, user._id as any as ObjectId),
	).toStrictEqual(user);
});

test(`${InMemoryDbInterface.name}.${InMemoryDbInterface.prototype.findObjectById.name}: Returns undefined if object not found`, async () => {
	const db = await getDb();

	expect(await db.findObjectById(CollectionId.Users, new ObjectId())).toBe(
		undefined,
	);
});

test(`${InMemoryDbInterface.name}.${InMemoryDbInterface.prototype.findObject.name}: Finds object by query`, async () => {
	const { db, user } = await getTestApiUtils();
	await db.addObject(CollectionId.Users, user);
	expect(
		await db.findObject(CollectionId.Users, { name: user.name }),
	).toStrictEqual(user);

	const secondUser = { _id: new ObjectId(), otherId: user._id };
	await db.addObject(CollectionId.Users, secondUser);
	expect(
		await db.findObject(CollectionId.Users, { otherId: user._id }),
	).toStrictEqual(secondUser);
});

test(`${InMemoryDbInterface.name}.${InMemoryDbInterface.prototype.findObject.name}: Returns undefined if object not found`, async () => {
	const db = await getDb();

	expect(await db.findObject(CollectionId.Users, { name: "Test User" })).toBe(
		undefined,
	);
});

test(`${InMemoryDbInterface.name}.${InMemoryDbInterface.prototype.findObjects.name}: Finds multiple objects by query`, async () => {
	const db = await getDb();

	const objects = [
		{ _id: new ObjectId(), name: "Test User", group: 1 },
		{ _id: new ObjectId(), name: "Test User 2", group: 1 },
		{ _id: new ObjectId(), name: "Test User 3", group: 2 },
	];

	for (const object of objects) {
		await db.addObject(CollectionId.Users, object as any as User);
	}

	expect(await db.findObjects(CollectionId.Users, { group: 1 })).toStrictEqual(
		objects.filter((o) => o.group === 1),
	);
	expect(
		await db.findObjects(CollectionId.Users, { name: objects[0].name }),
	).toStrictEqual([objects[0]]);
});

test(`${InMemoryDbInterface.name}.${InMemoryDbInterface.prototype.findObjects.name}: Returns empty array if objects not found`, async () => {
	const db = await getDb();

	expect(
		await db.findObjects(CollectionId.Users, { name: "Not Found" }),
	).toStrictEqual([]);
});

test(`${InMemoryDbInterface.name}.${InMemoryDbInterface.prototype.countObjects.name}: Counts objects`, async () => {
	const { user } = await getTestApiUtils();
	// User is automatically added to the DB in getTestApiUtils, so we need to create a fresh DB
	const db = await getDb();
	expect(await db.countObjects(CollectionId.Users, {})).toBe(0);

	await db.addObject(CollectionId.Users, user);
	expect(await db.countObjects(CollectionId.Users, {})).toBe(1);
});
