import { useState } from "react";
import { currentCart } from "@wix/ecom";
import { trackEvent } from "../utils/analytics";

const WIX_STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";

interface AdditionalLineItem {
  productId: string;
  productName: string;
  variantId?: string;
  quantity?: number;
  price?: number;
}

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  price?: number;
  currency?: string;
  variantId?: string;
  variantName?: string;
  quantity?: number;
  disabled?: boolean;
  modifierChoices?: Record<string, string>;
  customTextFields?: Record<string, string>;
  additionalLineItems?: AdditionalLineItem[];
}

export default function AddToCartButton({
  productId, productName, price, currency,
  variantId, variantName, quantity = 1, disabled,
  modifierChoices, customTextFields, additionalLineItems = [],
}: AddToCartButtonProps) {
  const [status, setStatus] = useState<"idle" | "added">("idle");

  const handleAddToCart = async () => {
    const totalDelta = quantity + additionalLineItems.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
    setStatus("added");
    setTimeout(() => setStatus("idle"), 2000);
    window.dispatchEvent(new CustomEvent("cart-updated", { detail: { delta: totalDelta } }));

    try {
      const catalogOptions: Record<string, unknown> = {};
      if (variantId) catalogOptions.variantId = variantId;
      if (modifierChoices && Object.keys(modifierChoices).length > 0) {
        catalogOptions.options = modifierChoices;
      }
      if (customTextFields && Object.keys(customTextFields).length > 0) {
        catalogOptions.customTextFields = customTextFields;
      }

      const lineItems = [
        {
          catalogReference: {
            appId: WIX_STORES_APP_ID,
            catalogItemId: productId,
            options: Object.keys(catalogOptions).length > 0 ? catalogOptions : undefined,
          },
          quantity,
        },
        ...additionalLineItems.map((item) => ({
          catalogReference: {
            appId: WIX_STORES_APP_ID,
            catalogItemId: item.productId,
            options: item.variantId ? { variantId: item.variantId } : undefined,
          },
          quantity: item.quantity ?? 1,
        })),
      ];

      const { cart } = await currentCart.addToCurrentCart({ lineItems });
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: { cart } }));
      trackEvent("AddToCart", {
        id: productId, name: productName, price, currency,
        quantity, variant: variantName, origin: "Product Page",
      });
      for (const item of additionalLineItems) {
        trackEvent("AddToCart", {
          id: item.productId, name: item.productName, price: item.price, currency,
          quantity: item.quantity ?? 1, origin: "Product Page — Setup",
        });
      }
    } catch {
      setStatus("idle");
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: {} }));
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || status === "added"}
      className="add-to-cart-btn"
    >
      {disabled ? "Select Options" : status === "added" ? "Added \u2713" : "Add to Cart"}
    </button>
  );
}
