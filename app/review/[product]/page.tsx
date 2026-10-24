import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import PageShell from "../../../components/PageShell";
import ReviewForm from "./ReviewForm";
import { REVIEW_PRODUCTS, isReviewProduct, ownReview } from "@/lib/reviews";
import { sessionForToken } from "@/lib/serverSession";

type Props = { params: Promise<{ product: string }>; searchParams: Promise<{ stars?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product } = await params;
  const name = isReviewProduct(product) ? REVIEW_PRODUCTS[product].name : "a program";
  return { title: `Review ${name}`, robots: { index: false, follow: false } };
}

// Where the stars in a review request email lead: the form, set to the star that was pressed,
// or to the review the person already wrote
export default async function ReviewPage({ params, searchParams }: Props) {
  const { product } = await params;
  if (!isReviewProduct(product)) notFound();
  const { stars } = await searchParams;
  const picked = Number(stars);
  const session = await sessionForToken((await cookies()).get("surveyor_auth_token")?.value).catch(() => null);
  const mine = session?.user ? await ownReview(session.user.id, product).catch(() => null) : null;
  const p = REVIEW_PRODUCTS[product];
  return (
    <PageShell>
      <div className="max-w-[640px] mx-auto px-5 sm:px-8">
        <ReviewForm
          product={product}
          name={p.name}
          href={p.href}
          initialRating={Number.isInteger(picked) && picked >= 1 && picked <= 5 ? picked : mine?.rating ?? 0}
          initialComment={mine?.comment ?? ""}
          hadReview={Boolean(mine)}
        />
      </div>
    </PageShell>
  );
}
