export async function addSearchPreference(preference: Omit<SearchPreference, 'id' | 'created_at' | 'updated_at'>): Promise<SearchPreference> {
    return await invoke('add_search_preference', { preference });
}

export async function updateSearchPreference(preference: Omit<SearchPreference, 'created_at' | 'updated_at'>): Promise<SearchPreference> {
    return await invoke('update_search_preference', { preference });
}

export async function getSearchPreference(id: string): Promise<SearchPreference> {
    return await invoke('get_search_preference', { id });
}

export async function getSearchPreferencesByUser(userId: string): Promise<SearchPreference[]> {
    return await invoke('get_search_preferences_by_user', { userId });
}

export async function deleteSearchPreference(id: string): Promise<void> {
    return await invoke('delete_search_preference', { id });
} 