export const db = {
  select: () => ({
    from: () => ({
      where: () => ({
        limit: () => [],
        orderBy: () => []
      }),
      orderBy: () => ({
        limit: () => []
      }),
      limit: () => []
    })
  }),
  insert: () => ({ values: () => ({ onConflictDoNothing: () => {}, onConflictDoUpdate: () => {} }) }),
  update: () => ({ set: () => ({ where: () => {} }) }),
  delete: () => ({ where: () => {} }),
  execute: () => ({ rows: [] })
};
