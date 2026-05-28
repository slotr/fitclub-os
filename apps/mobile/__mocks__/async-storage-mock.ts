const AsyncStorageMock = {
  setItem: async () => null,
  getItem: async () => null,
  removeItem: async () => null,
  removeMany: async () => null,
  getAllKeys: async () => [],
  multiSet: async () => null,
  multiGet: async () => [],
};

export default AsyncStorageMock;
