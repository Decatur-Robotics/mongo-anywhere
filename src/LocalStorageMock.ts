import { deserialize, serialize } from "./utils";

class LocalStorageMock {
	[key: string | symbol]: any;

	private store: { [key: string]: string };

	constructor() {
		this.store = {};
	}

	clear() {
		this.store = {};
	}

	getItem(key: string) {
		const val = this.store[key];
		if (!val) {
			return undefined;
		}
		return deserialize(JSON.parse(val));
	}

	setItem(key: string, value: object) {
		this.store[key] = JSON.stringify(serialize(value));
	}

	removeItem(key: string) {
		delete this.store[key];
	}

	key(index: number) {
		return Object.keys(this.store)[index];
	}

	get length() {
		return Object.keys(this.store ?? {}).length;
	}

	/**
	 * Custom indexer
	 */
	private static indexHandler: ProxyHandler<LocalStorageMock> = {
		get(target, prop) {
			if (typeof prop === "string" && !isNaN(Number(prop))) {
				return target.getItem(prop);
			}
			return target[prop];
		},
	};
}

export default LocalStorageMock;
