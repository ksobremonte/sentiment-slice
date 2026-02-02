import { useState, useRef } from "react";
import { Star, Send, CheckCircle, X, ImageIcon, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PublicLayout from "@/components/layout/PublicLayout";
import PublicReviewsList from "@/components/public/PublicReviewsList";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

const reviewSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  rating: z.number().min(1, "Please select a rating").max(5),
  feedback: z.string().trim().min(1, "Feedback is required").max(1000, "Feedback must be less than 1000 characters"),
  receipt_number: z.string().trim().min(1, "Receipt number is required").max(50, "Receipt number must be less than 50 characters"),
});

const Reviews = () => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Photo must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = reviewSchema.safeParse({ name, email, rating, feedback, receipt_number: receiptNumber });
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setIsSubmitting(true);

    try {
      let photoUrl: string | null = null;
      let sentiment: string | null = null;

      // Upload photo via secure edge function if provided
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        
        const uploadResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-review-photo`, {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || "Failed to upload photo");
        }

        const { url } = await uploadResponse.json();
        photoUrl = url;
      }

      // Analyze sentiment BEFORE inserting.
      // This avoids having to read back the inserted row, which is intentionally blocked by RLS.
      try {
        const reviewForAnalysis = {
          id: crypto.randomUUID(),
          name: validation.data.name,
          rating: validation.data.rating,
          feedback: validation.data.feedback,
          sentiment: null,
          created_at: new Date().toISOString(),
        };

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-reviews`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            reviews: [reviewForAnalysis],
            action: "analyze-sentiment",
          }),
        });

        if (response.ok) {
          const json = await response.json();
          const s = json && typeof json === "object" ? (json as any).sentiment : null;
          sentiment = typeof s === "string" ? s : null;
        }
      } catch (analyzeError) {
        // Sentiment is optional — never block submission.
        console.error("Auto-analyze failed:", analyzeError);
      }

      const { error } = await supabase.from("reviews").insert({
        name: validation.data.name,
        email: validation.data.email,
        rating: validation.data.rating,
        feedback: validation.data.feedback,
        receipt_number: validation.data.receipt_number,
        photo_url: photoUrl,
        sentiment,
      });

      if (error) throw error;

      // Immediately refresh the reviews list
      await queryClient.invalidateQueries({ queryKey: ["public-reviews"] });
      
      setIsSubmitted(true);
      toast.success("Thank you for your feedback!");
    } catch (error) {
      console.error("Error submitting review:", error);
      const message =
        error && typeof error === "object" && "message" in error && typeof (error as any).message === "string"
          ? (error as any).message
          : "Failed to submit review. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setRating(0);
    setFeedback("");
    setReceiptNumber("");
    removePhoto();
    setIsSubmitted(false);
  };

  return (
    <PublicLayout>
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
              Customer <span className="text-primary">Reviews</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              See what our customers are saying about Pizza Volante!
            </p>
          </div>

          {/* Tabs for Reviews and Submit Form */}
          <div className="max-w-3xl mx-auto">
            <Tabs defaultValue="reviews" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-14 p-1 bg-muted rounded-xl">
                <TabsTrigger value="reviews" className="rounded-lg text-base font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Star className="w-4 h-4 mr-2" />
                  Read Reviews
                </TabsTrigger>
                <TabsTrigger value="submit" className="rounded-lg text-base font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Send className="w-4 h-4 mr-2" />
                  Leave a Review
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="reviews">
                <PublicReviewsList />
              </TabsContent>
              
              <TabsContent value="submit">
            {isSubmitted ? (
              <div className="bg-card border-2 border-success/30 rounded-3xl p-10 text-center shadow-warm animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-success" />
                </div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                  Grazie Mille!
                </h2>
                <p className="text-muted-foreground mb-8 text-lg">
                  Your feedback has been submitted successfully. We appreciate you taking the time to share your experience with us!
                </p>
                <Button onClick={resetForm} variant="outline" size="lg" className="rounded-xl border-2">
                  Submit Another Review
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card border-2 border-border rounded-3xl p-8 md:p-10 shadow-warm space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground font-medium">Your Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl border-2 py-6 px-4 bg-background"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl border-2 py-6 px-4 bg-background"
                    required
                  />
                </div>

                {/* Rating */}
                <div className="space-y-3">
                  <Label className="text-foreground font-medium">Rate Your Experience</Label>
                  <div className="flex gap-2 justify-center py-4 bg-muted/50 rounded-xl">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="p-2 transition-transform hover:scale-125"
                      >
                        <Star
                          className={`w-10 h-10 transition-colors ${
                            star <= (hoveredRating || rating)
                              ? "fill-warning text-warning"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Receipt Number */}
                <div className="space-y-2">
                  <Label htmlFor="receipt" className="text-foreground font-medium">
                    Receipt Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="receipt"
                    placeholder="Enter your receipt number"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    className="rounded-xl border-2 py-6 px-4 bg-background"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the receipt number from your order to verify your purchase.
                  </p>
                </div>

                {/* Photo Upload */}
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Upload Photo (Optional)</Label>
                  <div className="space-y-3">
                    {photoPreview ? (
                      <div className="relative inline-block">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="max-h-48 rounded-2xl border-2 border-border object-cover shadow-subtle"
                        />
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute -top-3 -right-3 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 shadow-card"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                      >
                        <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground font-medium">
                          Click to upload a photo
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-2">
                          Max 5MB • JPG, PNG, WebP
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Feedback */}
                <div className="space-y-2">
                  <Label htmlFor="feedback" className="text-foreground font-medium">Your Feedback</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Tell us about your experience..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={5}
                    className="rounded-xl border-2 px-4 py-3 bg-background resize-none"
                    required
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg rounded-xl shadow-warm"
                  size="lg"
                >
                  {isSubmitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </form>
            )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Reviews;
