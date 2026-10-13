let owner = null;
export function setRankingOwner(value) { owner = value ? { profileId: value.id, uid: value.uid || null } : null; }
export function getRankingOwner() { return owner ? { ...owner } : null; }
