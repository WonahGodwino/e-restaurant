import PolicyPage from "@/components/PolicyPage";

export default function TermsAndConditionsPage() {
  return (
    <PolicyPage
      eyebrow="Terms"
      title="Terms and Conditions"
      summary="These terms govern the use of the online ordering platform, including menu availability, checkout, delivery expectations, and support interactions."
      sections={[
        {
          heading: "Orders and availability",
          paragraphs: [
            "All menu items are subject to availability. Stock levels, pricing, modifiers, and delivery options may change without notice before checkout is completed.",
            "An order is only accepted once the platform confirms checkout initiation and the restaurant is able to process the requested items.",
          ],
        },
        {
          heading: "Pricing and service",
          paragraphs: [
            "Displayed pricing is provided in the configured store currency and may include item prices, delivery charges, applicable taxes, and any discounts or promotions.",
            "Customers are responsible for providing accurate order, contact, and delivery details so the restaurant can complete fulfilment.",
          ],
        },
        {
          heading: "Platform use",
          paragraphs: [
            "Customers must not misuse the ordering platform, submit fraudulent orders, or attempt to disrupt service availability.",
            "The restaurant may refuse or cancel orders where there is clear pricing error, suspected fraud, unavailable stock, or incomplete delivery information.",
          ],
        },
      ]}
    />
  );
}