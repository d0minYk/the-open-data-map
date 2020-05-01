import { Plugins } from '@capacitor/core';
const { Storage } = Plugins;

class StorageWrapper {

    static async set(key, value) {
        return await Storage.set({
            key: key,
            value: value
        });
    }

    static async get(key) {
        return (await Storage.get({ key: key })).value;
    }

    static async remove(key) {
        return await Storage.remove({ key: key });
    }

    static async keys() {
        return await Storage.keys();
    }

    static async clear() {
        return await Storage.clear();
    }

    static async setO(key, value) {
        return await Storage.set({
            key: key,
            value: JSON.stringify(value)
        });
    }

    static async getO(key) {
        let str = await Storage.get({ key: key })
        if (str.value && str.value !== "undefined" && str.value !== "null")
            return JSON.parse(str.value);
        return null;
    }

};

export default StorageWrapper;
