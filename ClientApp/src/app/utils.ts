export function safeJSONParse(obj: any) {
    try {
        return JSON.parse(obj);
    } catch (e) {
        return null;
    }
}
