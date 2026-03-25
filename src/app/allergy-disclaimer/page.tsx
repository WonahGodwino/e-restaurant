import PolicyPage from "@/components/PolicyPage";

export default function AllergyDisclaimerPage() {
  return (
    <PolicyPage
      eyebrow="Allergens"
      title="Allergy Disclaimer"
      summary="This page explains how customers should use allergen information and the limits of any allergen guidance shown on the site before formal allergen features are fully implemented."
      sections={[
        {
          heading: "Allergen visibility",
          paragraphs: [
            "Menu descriptions and support responses may provide ingredient guidance, but customers with allergies should always contact the restaurant directly when they need confirmation before ordering.",
            "Recipes, suppliers, and kitchen processes can change, which means allergen information must be treated carefully and rechecked when necessary.",
          ],
        },
        {
          heading: "Cross-contamination risk",
          paragraphs: [
            "Our kitchen may handle common allergens including nuts, sesame, dairy, gluten, eggs, fish, shellfish, soy, mustard, celery, sulphites, and other ingredients that can trigger reactions.",
            "Because equipment and preparation areas may be shared, the restaurant cannot guarantee the total absence of cross-contact unless a dedicated allergen-safe process is explicitly confirmed.",
          ],
        },
        {
          heading: "Customer responsibility",
          paragraphs: [
            "Customers with allergies or intolerances should contact the restaurant before ordering and again if anything in the order details changes.",
            "If there is any uncertainty about a dish, customers should not proceed until they have received confirmation from the restaurant team.",
          ],
        },
      ]}
    />
  );
}