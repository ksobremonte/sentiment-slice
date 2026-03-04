import { useState, useRef } from "react";
import { Star, Send, CheckCircle, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PublicLayout from "@/components/layout/PublicLayout";
import { Link } from "react-router-dom";
import { FadeIn, AnimatedButton } from "@/components/ui/animated";
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
  has_photo: z.literal(true, { errorMap: () => ({ message: "Receipt photo is required" }) }),
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
      if (file.size > 5 * 1024 * 1024) { toast.error("Photo must be less than 5MB"); return; }
      if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) { URL.revokeObjectURL(photoPreview); setPhotoPreview(null); }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = reviewSchema.safeParse({ name, email, rating, feedback, receipt_number: receiptNumber, has_photo: !!photoFile as true });
    if (!validation.success) { toast.error(validation.error.errors[0].message); return; }

    setIsSubmitting(true);
    try {
      let photoUrl: string | null = null;
      let sentiment: string | null = null;
      let language: string | null = null;
      let approved: boolean = true;
      let sentimentReason: string | null = null;
      let sentimentKeywords: string[] | null = null;

      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-review-photo`, { method: "POST", body: formData });
        if (!uploadResponse.ok) { const errorData = await uploadResponse.json(); throw new Error(errorData.error || "Failed to upload photo"); }
        const { url } = await uploadResponse.json();
        photoUrl = url;
      }

      try {
        const reviewForAnalysis = { id: crypto.randomUUID(), name: validation.data.name, rating: validation.data.rating, feedback: validation.data.feedback, sentiment: null, created_at: new Date().toISOString() };
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ reviews: [reviewForAnalysis], action: "analyze-sentiment" }),
        });
        if (response.ok) {
          const json = await response.json();
          sentiment = json?.sentiment ?? null;
          language = json?.language ?? null;
          approved = json?.approved ?? true;
          sentimentReason = json?.reasoning ?? null;
          sentimentKeywords = json?.keyPhrases ?? null;
        }
      } catch (analyzeError) { console.error("Auto-analyze failed:", analyzeError); }

      const { error } = await supabase.from("reviews").insert({
        name: validation.data.name, email: validation.data.email, rating: validation.data.rating,
        feedback: validation.data.feedback, receipt_number: validation.data.receipt_number,
        photo_url: photoUrl, sentiment, language, approved,
        sentiment_reason: sentimentReason, sentiment_keywords: sentimentKeywords,
      });
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["public-reviews"] });
      setIsSubmitted(true);
      toast.success("Review submitted successfully with receipt photo!");
    } catch (error) {
      console.error("Error submitting review:", error);
      const message = error && typeof error === "object" && "message" in error && typeof (error as any).message === "string" ? (error as any).message : "Failed to submit review. Please try again.";
      toast.error(message);
    } finally { setIsSubmitting(false); }
  };

  const resetForm = () => { setName(""); setEmail(""); setRating(0); setFeedback(""); setReceiptNumber(""); removePhoto(); setIsSubmitted(false); };

  return (
    <PublicLayout>
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-6">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center mb-12">
              <p className="text-xs font-semibold text-primary uppercase tracking-[0.25em] mb-3">Share Your Experience</p>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">Leave a Review</h1>
              <div className="section-divider mt-4" />
              <p className="text-muted-foreground max-w-md mx-auto mt-4">Your feedback helps us serve you better.</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="max-w-2xl mx-auto mb-12">
              {isSubmitted ? (
                <div className="bg-card border border-success/20 rounded-2xl p-10 text-center shadow-card">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">Grazie Mille!</h2>
                  <p className="text-muted-foreground mb-8">Your feedback has been submitted successfully.</p>
                  <Button onClick={resetForm} variant="outline" size="lg" className="rounded-xl">Submit Another Review</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-8 shadow-card space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-foreground font-medium text-sm">Your Name</Label>
                      <Input id="name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg bg-background" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground font-medium text-sm">Email Address</Label>
                      <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg bg-background" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground font-medium text-sm">Rate Your Experience</Label>
                    <div className="flex items-center justify-center gap-2 py-5 bg-muted/30 rounded-xl">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setRating(star)} onMouseEnter={() => setHoveredRating(star)} onMouseLeave={() => setHoveredRating(0)} className="p-1 transition-transform hover:scale-125">
                          <Star className={`w-8 h-8 transition-colors duration-200 ${star <= (hoveredRating || rating) ? "fill-warning text-warning" : "text-muted-foreground/30 stroke-[1.5]"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receipt" className="text-foreground font-medium text-sm">Receipt Number <span className="text-destructive">*</span></Label>
                    <Input id="receipt" placeholder="Enter your receipt number" value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} className="rounded-lg bg-background" required />
                    <p className="text-xs text-muted-foreground">Enter the receipt number from your order.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground font-medium text-sm">Receipt Photo <span className="text-destructive">*</span></Label>
                    {photoPreview ? (
                      <div className="relative inline-block">
                        <img src={photoPreview} alt="Preview" className="max-h-40 rounded-xl border border-border object-cover" />
                        <button type="button" onClick={removePhoto} className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div onClick={() => { if (fileInputRef.current) { fileInputRef.current.setAttribute("capture", "environment"); fileInputRef.current.click(); } }} className="flex-1 border border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                          <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                          <p className="text-xs text-muted-foreground font-medium">📷 Take Photo</p>
                          <p className="text-xs text-muted-foreground mt-1">Opens camera on mobile</p>
                        </div>
                        <div onClick={() => { if (fileInputRef.current) { fileInputRef.current.removeAttribute("capture"); fileInputRef.current.click(); } }} className="flex-1 border border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                          <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                          <p className="text-xs text-muted-foreground font-medium">📁 Browse Files</p>
                          <p className="text-xs text-muted-foreground mt-1">Max 5MB</p>
                        </div>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback" className="text-foreground font-medium text-sm">Your Feedback</Label>
                    <Textarea id="feedback" placeholder="Tell us about your experience..." value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} className="rounded-lg bg-background resize-none" required />
                  </div>

                  <AnimatedButton>
                    <Button type="submit" disabled={isSubmitting} className="w-full py-6 text-base rounded-xl shadow-warm" size="lg">
                      {isSubmitting ? "Submitting..." : (<><Send className="w-4 h-4 mr-2" />Submit Feedback</>)}
                    </Button>
                  </AnimatedButton>
                </form>
              )}
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="max-w-3xl mx-auto text-center">
              <AnimatedButton>
                <Link to="/read-reviews">
                  <Button variant="outline" size="lg" className="rounded-xl font-semibold">
                    <Star className="w-4 h-4 mr-2" />
                    Read All Customer Reviews
                  </Button>
                </Link>
              </AnimatedButton>
            </div>
          </FadeIn>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Reviews;
