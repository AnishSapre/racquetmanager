"use client";
import { PiRacquet } from "react-icons/pi";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

const Navbar = () => {
  const { data: session } = useSession();

  return (
    <nav className="bg-gray-900 text-white p-3 flex justify-between items-center">
      <Link href="/match-type" className="flex items-center">
        <PiRacquet className="m-5 scale-200" />
        <h1 className="text-lg font-bold cursor-pointer">Racquet Manager</h1>
      </Link>

      <div className="flex items-center space-x-4">
        {session?.user?.image && (
          <img
            src={session.user.image}
            alt="User Profile"
            className="w-10 h-10 rounded-full border-2 border-white"
          />
        )}

        {session && (
          <button
            onClick={() => signOut()}
            className="bg-red-500 px-2 py-2 rounded font-mono cursor-pointer hover:bg-red-400"
          >
            Sign Out
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
