"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

// Split the validation schema for different steps
const firstStepSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  age: z
    .number()
    .min(16, "Must be at least 16 years old")
    .max(100, "Age cannot exceed 100"),
  photo: z.string().url("Invalid photo URL").optional(),
});

const finalStepSchema = z.object({
  displayName: z.string(),
  age: z.number(),
  photo: z.string().optional(),
  interests: z.array(z.string()).min(1, "Please select at least one interest"),
});

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    displayName: "",
    age: 18,
    photo: "",
    interests: [] as string[],
  });

  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUserId(user.id);
    };

    checkUser();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId) {
      console.error("No userId found");
      setError("Not authenticated");
      return;
    }

    if (step < 2) {
      // Validate first step only
      try {
        firstStepSchema.parse(formData);
        setStep(step + 1);
      } catch (err) {
        if (err instanceof z.ZodError) {
          setError(err.errors[0].message);
        }
        return;
      }
    } else {
      // Validate all data including interests
      try {
        const validatedData = finalStepSchema.parse(formData);

        // Get current user's email
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.email) {
          console.error("User email not found");
          setError("User email not found");
          return;
        }

        // First try to update existing profile
        const { data: updateData, error: updateError } = await supabase
          .from("user_profiles")
          .upsert(
            {
              user_id: userId,
              display_name: validatedData.displayName,
              age: validatedData.age,
              photo_url: validatedData.photo,
              interests: validatedData.interests,
              email: user.email,
            },
            {
              onConflict: "user_id",
              ignoreDuplicates: false,
            }
          )
          .select()
          .single();

        if (updateError) {
          console.error("Error saving profile:", updateError);
          setError(updateError.message);
          return;
        }

        console.log("Profile saved successfully:", updateData);
        window.location.href = "/protected";
      } catch (err) {
        console.error("Error in form submission:", err);
        setError(
          err instanceof z.ZodError
            ? err.errors[0].message
            : "An error occurred"
        );
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAgeChange = (newAge: number) => {
    setFormData((prev) => ({ ...prev, age: newAge }));
    setError(null);
  };

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
    setError(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setFormData((prev) => ({ ...prev, photo: base64String }));
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error processing file:", error);
        setError("Failed to process photo");
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center font-akshar">
      <div className="max-w-sm w-full px-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {step === 1 && (
            <div className="space-y-8">
              {/* Photo Upload */}
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 mb-2">
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                    {formData.photo ? (
                      <Image
                        src={formData.photo}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                        width={96}
                        height={96}
                      />
                    ) : (
                      <span className="text-3xl text-gray-400">+</span>
                    )}
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
                <span className="text-gray-600 text-md">Add Photo</span>
              </div>

              {/* Display Name */}
              <div>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="Display name"
                  className="w-full p-2.5 text-md border border-gray-200 rounded-lg focus:border-gray-400 focus:ring-0"
                  required
                />
              </div>

              {/* Age Selection */}
              <div className="space-y-2">
                <p className="text-center text-gray-600 text-md">
                  Choose your age
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={(e) => handleAgeChange(parseInt(e.target.value))}
                    min={1}
                    max={100}
                    className="w-20 p-2 text-md border border-gray-200 rounded-lg focus:border-gray-400 focus:ring-0 text-center"
                  />
                </div>
                {formData.age < 16 && (
                  <p className="text-red-500 text-sm text-center">
                    Must be at least 16 years old
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-center text-lg">Select Your Interests</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "Technology", icon: "💻" },
                  { name: "Gaming", icon: "🎮" },
                  { name: "Music", icon: "🎵" },
                  { name: "Sports", icon: "⚽" },
                  { name: "Art", icon: "🎨" },
                  { name: "Travel", icon: "✈️" },
                  { name: "Food", icon: "🍔" },
                  { name: "Fitness", icon: "💪" },
                ].map((interest) => (
                  <button
                    key={interest.name}
                    type="button"
                    onClick={() => handleInterestToggle(interest.name)}
                    className={`p-3 text-md rounded-lg border flex items-center space-x-2 ${
                      formData.interests.includes(interest.name)
                        ? "border-[#4BBDF1] bg-[#4BBDF1] text-black"
                        : "border-gray-200"
                    }`}>
                    <span>{interest.icon}</span>
                    <span>{interest.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full p-3 text-md bg-black text-white rounded-full hover:bg-gray-900">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
