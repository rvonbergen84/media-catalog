import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    signIn({ profile }) {
      const allowed = (process.env.ALLOWED_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      if (allowed.length === 0) return true;

      const email = profile?.email?.toLowerCase();
      return email ? allowed.includes(email) : false;
    },
    authorized({ auth: session }) {
      return !!session?.user;
    },
  },
});
