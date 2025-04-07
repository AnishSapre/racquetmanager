"use client"; // Ensure this is at the very top

import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

const HomePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/match-type"); // Redirect if already signed in
    }
  }, [status, router]);

  return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center text-white">
      <h1 className="text-2xl mb-6 font-extrabold">Welcome</h1>

      {status === "loading" ? (
        <p>Loading...</p> // Show a loading message while checking session
      ) : (
        <div className="space-y-4 flex flex-col">
          <button
            onClick={() => signIn("google")}
            className="bg-white px-6 py-5 rounded-lg hover:bg-gray-300 text-black flex justify-center items-center cursor-pointer text-xl"
          >
            <FcGoogle className="my-1 mr-4 scale-200" /> Continue with Google
          </button>

          <button className="bg-white px-6 py-5 rounded-lg hover:bg-gray-300 text-black flex justify-center items-center cursor-pointer text-xl">
            <FaApple className="my-1 mr-4 scale-200" />Continue with Apple
          </button>

          <button className="bg-white px-6 py-5 rounded-lg hover:bg-gray-300 text-black flex justify-center items-center cursor-pointer text-xl">
            <MdEmail className="my-1 mr-4 scale-200" />Continue with Email
          </button>
        </div>
      )}
    </div>
  );
};

export default HomePage;
