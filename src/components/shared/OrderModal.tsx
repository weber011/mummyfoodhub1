"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(5, "Complete address is required"),
  landmark: z.string().optional(),
  quantity: z.string().min(1, "Quantity is required"),
  deliveryTime: z.string().min(2, "Delivery time is required"),
  paymentMode: z.string().min(2, "Payment mode is required"),
  notes: z.string().optional(),
});

type OrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  itemPrice: number;
};

export function OrderModal({ isOpen, onClose, itemName, itemPrice }: OrderModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: "1",
      paymentMode: "UPI / Cash on Delivery",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const total = itemPrice * parseInt(values.quantity);
    
    // Format WhatsApp Message
    const message = `Hello Mummy Food Hub,

Name: ${values.name}
Phone: ${values.phone}
Address: ${values.address}
Landmark: ${values.landmark || "N/A"}
Meal: ${itemName}
Quantity: ${values.quantity}
Delivery Time: ${values.deliveryTime}
Payment: ${values.paymentMode}
Total: ₹${total}
Notes: ${values.notes || "None"}
`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/917065665988?text=${encodedMessage}`, "_blank");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-foreground">Order Details</DialogTitle>
          <DialogDescription className="font-subheading text-muted-foreground">
            Complete your order for <span className="font-bold text-primary">{itemName}</span> (₹{itemPrice})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <input 
                {...register("name")}
                className="w-full p-2 border border-border rounded-md focus:outline-none focus:border-primary bg-background text-foreground"
                placeholder="John Doe"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <input 
                {...register("phone")}
                className="w-full p-2 border border-border rounded-md focus:outline-none focus:border-primary bg-background text-foreground"
                placeholder="10 digit number"
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <textarea 
              {...register("address")}
              className="w-full p-2 border border-border rounded-md focus:outline-none focus:border-primary bg-background text-foreground min-h-[60px]"
              placeholder="House/Flat No, Society, Sector"
            />
            {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Landmark (Optional)</label>
              <input 
                {...register("landmark")}
                className="w-full p-2 border border-border rounded-md focus:outline-none focus:border-primary bg-background text-foreground"
                placeholder="Near mother dairy"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <input 
                type="number"
                min="1"
                {...register("quantity")}
                className="w-full p-2 border border-border rounded-md focus:outline-none focus:border-primary bg-background text-foreground"
              />
              {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Delivery Time</label>
              <select 
                {...register("deliveryTime")}
                className="w-full p-2 border border-border rounded-md focus:outline-none focus:border-primary bg-background text-foreground"
              >
                <option value="">Select Time</option>
                <option value="Lunch (12:30 PM - 2:00 PM)">Lunch (12:30 PM - 2:00 PM)</option>
                <option value="Dinner (8:00 PM - 9:30 PM)">Dinner (8:00 PM - 9:30 PM)</option>
                <option value="Custom Time">Custom Time (Mention in Notes)</option>
              </select>
              {errors.deliveryTime && <p className="text-xs text-red-500">{errors.deliveryTime.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Mode</label>
              <select 
                {...register("paymentMode")}
                className="w-full p-2 border border-border rounded-md focus:outline-none focus:border-primary bg-background text-foreground"
              >
                <option value="UPI / Cash on Delivery">UPI / Cash on Delivery</option>
                <option value="Monthly Advance">Monthly Advance</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Notes (Optional)</label>
            <input 
              {...register("notes")}
              className="w-full p-2 border border-border rounded-md focus:outline-none focus:border-primary bg-background text-foreground"
              placeholder="e.g. Less spicy, Extra onion"
            />
          </div>

          <div className="pt-4 border-t border-border mt-6">
            <button 
              type="submit" 
              className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors shadow-md"
            >
              Order via WhatsApp
            </button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              You will be redirected to WhatsApp to confirm your order.
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
