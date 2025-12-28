import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        // Simple hardcoded user for testing
        // You can replace this with database check later
        if (
          credentials.email === "test@example.com" &&
          credentials.password === "password123"
        ) {
          return {
            id: "1",
            name: "Test User",
            email: "test@example.com",
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtectedRoute =
        nextUrl.pathname.startsWith("/tasks") ||
        nextUrl.pathname.startsWith("/calendar") ||
        nextUrl.pathname.startsWith("/goals") ||
        nextUrl.pathname.startsWith("/focus") ||
        nextUrl.pathname.startsWith("/profile") ||
        nextUrl.pathname.startsWith("/training");

      if (isOnProtectedRoute && !isLoggedIn) {
        return false; // Redirect to login
      }

      return true;
    },
  },
});
