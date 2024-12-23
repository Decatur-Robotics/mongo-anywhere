# Mongo Anywhere

Run MongoDB anywhere - in memory, in local storage, or in the cloud.

Provides a `DbInterface` class that forms the base of all Mongo Anywhere classes. This class defines a set of methods for using Mongo,
regardless of whether it's in memory or in the cloud.

To use Mongo Anywhere, create an instance of one of `DbInterface`'s subclasses and then call `.init` on it, as follows:

```typescript
const db = new InMemoryDbInterface();
await db.init();
```

Currently offers the following subclasses:

- `InMemoryDbInterface` - Stores data in memory. This implementation is used for unit tests.
- `MongoDbInterface` - Stores data in a MongoDB database. Requires a `MongoClient` instance to be passed in.

Mongo Anywhere © 2024 by Decatur Robotics is licensed under the MIT License.
