import 'vue-router';

export { };

declare module 'vue-router' {
  interface RouteMeta {
    title: string;
    requiresAuth?: boolean;
    allows?: Array<'ADMIN' | 'SECURITY' | 'USER'>;
  }
}
