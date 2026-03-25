import PolicyPage from "@/components/PolicyPage";

export default function DeliveryPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Delivery"
      title="Delivery Policy"
      summary="This policy outlines service area assumptions, delivery timing expectations, customer responsibilities, and what happens when fulfilment conditions change."
      sections={[
        {
          heading: "Service coverage",
          paragraphs: [
            "Delivery is available only within the restaurant's supported service area and may be restricted by postcode, minimum order value, or business hours.",
            "If an address falls outside the supported zone, the order may be declined before payment or redirected to collection where available.",
          ],
        },
        {
          heading: "Timing and handoff",
          paragraphs: [
            "Estimated times are provided for convenience and may vary based on kitchen demand, traffic, weather, or courier availability.",
            "Customers should ensure someone is available to receive the order at the stated delivery address and contact number.",
          ],
        },
        {
          heading: "Failed delivery attempts",
          paragraphs: [
            "If the courier cannot complete delivery because the customer is unavailable or the address details are inaccurate, the restaurant may attempt contact before marking the delivery failed.",
            "Additional charges or limited refund eligibility may apply where food has already been prepared and dispatched.",
          ],
        },
      ]}
    />
  );
}