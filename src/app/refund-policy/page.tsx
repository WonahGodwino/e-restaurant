import PolicyPage from "@/components/PolicyPage";

export default function RefundPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Refunds"
      title="Refund Policy"
      summary="This policy sets expectations for cancellations, order issues, and how refund or credit decisions are handled for restaurant orders."
      sections={[
        {
          heading: "Before preparation",
          paragraphs: [
            "Orders may be cancelled before food preparation begins, subject to payment provider status and the restaurant's ability to stop fulfilment in time.",
            "Where a cancellation is accepted before preparation, the customer may receive a full refund or payment reversal.",
          ],
        },
        {
          heading: "After preparation or dispatch",
          paragraphs: [
            "Once food has been prepared or dispatched, refunds are generally limited to cases involving incorrect items, missing items, damaged delivery, or verified service failure.",
            "Photographs, order details, and prompt reporting may be required so support can review the issue fairly.",
          ],
        },
        {
          heading: "How to request support",
          paragraphs: [
            "Customers should contact support as soon as possible after receiving an order issue, using the website contact form or the published support channels.",
            "Approved remedies may include a refund, partial refund, replacement, or account credit depending on the circumstances.",
          ],
        },
      ]}
    />
  );
}