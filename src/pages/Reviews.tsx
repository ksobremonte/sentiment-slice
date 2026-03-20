import { useState, useRef } from "react";
import { Star, Send, CheckCircle, X, ImageIcon, Camera, Loader2, AlertTriangle, Check } from "lucide-react";
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
import { cn } from "@/lib/utils";

const reviewSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  rating: z.number().min(1, "Please select a rating").max(5),
  feedback: z.string().trim().min(1, "Feedback is required").max(1000, "Feedback must be less than 1000 characters"),
  receipt_number: z.string().trim().min(1, "Receipt number is required").max(50, "Receipt number must be less than 50 characters"),
});

const MIN_PHOTOS = 2;
const MAX_PHOTOS = 3;

interface PhotoItem {
  file: File;
  preview: string;
  status: "pending" | "uploading" | "analyzing" | "relevant" | "irrelevant" | "error";
  url?: string;
  category?: string;
  reason?: string;
}

const Reviews = () => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }

    const newFiles = Array.from(files).slice(0, remaining);
    const newPhotos: PhotoItem[] = [];

    for (const file of newFiles) {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name}: Photo must be less than 5MB`); continue; }
      if (!file.type.startsWith("image/")) { toast.error(`${file.name}: Please upload an image file`); continue; }
      newPhotos.push({ file, preview: URL.createObjectURL(file), status: "pending" });
    }

    if (newPhotos.length > 0) {
      const updatedPhotos = [...photos, ...newPhotos];
      setPhotos(updatedPhotos);

      // Upload and analyze each new photo
      for (let i = photos.length; i < updatedPhotos.length; i++) {
        await uploadAndAnalyze(updatedPhotos, i);
      }
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const uploadAndAnalyze = async (currentPhotos: PhotoItem[], index: number) => {
    // Upload
    setPhotos(prev => prev.map((p, i) => i === index ? { ...p, status: "uploading" } : p));

    try {
      const formData = new FormData();
      formData.append("file", currentPhotos[index].file);
      const uploadRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-review-photo`, { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "Upload failed");
      }
      const { url } = await uploadRes.json();

      // Analyze
      setPhotos(prev => prev.map((p, i) => i === index ? { ...p, status: "analyzing", url } : p));

      try {
        const analyzeRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ imageUrl: url }),
        });

        if (analyzeRes.ok) {
          const result = await analyzeRes.json();
          setPhotos(prev => prev.map((p, i) => i === index ? {
            ...p,
            status: result.relevant ? "relevant" : "irrelevant",
            category: result.category,
            reason: result.reason,
          } : p));

          if (!result.relevant) {
            toast.warning(`Image classified as irrelevant: ${result.reason}`);
          }
        } else {
          // Analysis failed, allow by default
          setPhotos(prev => prev.map((p, i) => i === index ? { ...p, status: "relevant", category: "other_relevant", reason: "Analysis unavailable" } : p));
        }
      } catch {
        setPhotos(prev => prev.map((p, i) => i === index ? { ...p, status: "relevant", category: "other_relevant", reason: "Analysis unavailable" } : p));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload photo");
      setPhotos(prev => prev.map((p, i) => i === index ? { ...p, status: "error" } : p));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const relevantPhotos = photos.filter(p => p.status === "relevant" && p.url);
  const hasIrrelevantPhotos = photos.some(p => p.status === "irrelevant");
  const isProcessing = photos.some(p => p.status === "uploading" || p.status === "analyzing");
  const canSubmit = relevantPhotos.length >= MIN_PHOTOS && !isProcessing && !hasIrrelevantPhotos;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = reviewSchema.safeParse({ name, email, rating, feedback, receipt_number: receiptNumber });
    if (!validation.success) { toast.error(validation.error.errors[0].message); return; }

    if (relevantPhotos.length < MIN_PHOTOS) {
      toast.error(`Please upload at least ${MIN_PHOTOS} relevant photos`);
      return;
    }

    if (hasIrrelevantPhotos) {
      toast.error("Please remove irrelevant photos before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const photoUrls = relevantPhotos.map(p => p.url!);
      let sentiment: string | null = null;
      let language: string | null = null;
      let approved: boolean = true;
      let sentimentReason: string | null = null;
      let sentimentKeywords: string[] | null = null;

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
        photo_url: photoUrls[0], photo_urls: photoUrls,
        sentiment, language, approved,
        sentiment_reason: sentimentReason, sentiment_keywords: sentimentKeywords,
      } as any);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["public-reviews"] });
      setIsSubmitted(true);
      toast.success("Thank you for your feedback!");
    } catch (error) {
      console.error("Error submitting review:", error);
      const message = error && typeof error === "object" && "message" in error && typeof (error as any).message === "string" ? (error as any).message : "Failed to submit review. Please try again.";
      toast.error(message);
    } finally { setIsSubmitting(false); }
  };

  const resetForm = () => {
    setName(""); setEmail(""); setRating(0); setFeedback(""); setReceiptNumber("");
    photos.forEach(p => URL.revokeObjectURL(p.preview));
    setPhotos([]);
    setIsSubmitted(false);
  };

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

                  {/* Multi-photo upload */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-foreground font-medium text-sm">
                        Upload Photos <span className="text-destructive">*</span>
                      </Label>
                      <span className="text-xs text-muted-foreground font-medium">
                        {photos.length}/{MAX_PHOTOS} · Min {MIN_PHOTOS} required
                      </span>
                    </div>

                    {/* Photo previews */}
                    {photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {photos.map((photo, index) => (
                          <div key={index} className={cn(
                            "relative rounded-xl border-2 overflow-hidden aspect-square",
                            photo.status === "relevant" && "border-success",
                            photo.status === "irrelevant" && "border-destructive",
                            photo.status === "error" && "border-destructive",
                            (photo.status === "uploading" || photo.status === "analyzing" || photo.status === "pending") && "border-primary/40",
                          )}>
                            <img src={photo.preview} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />

                            {/* Status overlay */}
                            {(photo.status === "uploading" || photo.status === "analyzing") && (
                              <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-1">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                <span className="text-xs font-medium text-foreground">
                                  {photo.status === "uploading" ? "Uploading..." : "Analyzing..."}
                                </span>
                              </div>
                            )}

                            {photo.status === "relevant" && (
                              <div className="absolute top-1.5 left-1.5 bg-success text-success-foreground rounded-full p-1">
                                <Check className="w-3 h-3" />
                              </div>
                            )}

                            {photo.status === "irrelevant" && (
                              <div className="absolute inset-0 bg-destructive/20 flex flex-col items-center justify-center p-2">
                                <AlertTriangle className="w-5 h-5 text-destructive mb-1" />
                                <span className="text-xs font-medium text-destructive text-center leading-tight">{photo.reason || "Not relevant"}</span>
                              </div>
                            )}

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute top-1.5 right-1.5 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>

                            {/* Category badge */}
                            {photo.category && photo.status === "relevant" && (
                              <div className="absolute bottom-1.5 left-1.5 right-1.5">
                                <span className="text-[10px] bg-success/90 text-success-foreground px-2 py-0.5 rounded-full font-medium capitalize">
                                  {photo.category.replace("_", " ")}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload buttons */}
                    {photos.length < MAX_PHOTOS && (
                      <div className="grid grid-cols-2 gap-3">
                        <div onClick={() => cameraInputRef.current?.click()} className="border border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                          <Camera className="w-7 h-7 mx-auto text-muted-foreground/40 mb-1.5" />
                          <p className="text-xs text-muted-foreground font-medium">Take Photo</p>
                        </div>
                        <div onClick={() => fileInputRef.current?.click()} className="border border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                          <ImageIcon className="w-7 h-7 mx-auto text-muted-foreground/40 mb-1.5" />
                          <p className="text-xs text-muted-foreground font-medium">Upload Photo</p>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Upload {MIN_PHOTOS}–{MAX_PHOTOS} photos of your dining experience. Each image is analyzed for restaurant relevance.
                    </p>

                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoAdd} className="hidden" />
                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoAdd} className="hidden" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback" className="text-foreground font-medium text-sm">Your Feedback</Label>
                    <Textarea id="feedback" placeholder="Tell us about your experience..." value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} className="rounded-lg bg-background resize-none" required />
                  </div>

                  <AnimatedButton>
                    <Button type="submit" disabled={isSubmitting || !canSubmit} className="w-full py-6 text-base rounded-xl shadow-warm" size="lg">
                      {isSubmitting ? "Submitting..." : (<><Send className="w-4 h-4 mr-2" />Submit Feedback</>)}
                    </Button>
                  </AnimatedButton>

                  {!canSubmit && photos.length > 0 && !isProcessing && (
                    <p className="text-xs text-destructive text-center font-medium">
                      {hasIrrelevantPhotos
                        ? "Please remove irrelevant photos before submitting"
                        : `Please upload at least ${MIN_PHOTOS} relevant photos`}
                    </p>
                  )}
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
