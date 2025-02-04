import { deserialize, serialize } from './utils';
export default class {
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
}