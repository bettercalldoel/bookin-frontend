export type DashboardUser = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  emailVerifiedAt: string | null;
  hasPassword?: boolean;
  tenantProfile?: { companyName?: string | null } | null;
};

export type NavKey =
  | "tenant-profile"
  | "property-category"
  | "property-management"
  | "room-management"
  | "order-management"
  | "customer-relations"
  | "sales-report"
  | "dashboard-overview";

export type NavItem = {
  key: NavKey;
  label: string;
  helper: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export type RoomActionConfirmState = {
  title: string;
  description: string;
  payload: Record<string, unknown>;
  successMessage: string;
};

export type TenantActionConfirmPayload =
  | {
      type: "create-category";
      name: string;
    }
  | {
      type: "update-category";
      id: string;
      name: string;
    }
  | {
      type: "delete-category";
      id: string;
      name: string;
    }
  | {
      type: "delete-property";
      id: string;
      name: string;
    }
  | {
      type: "apply-room-sidebar";
      roomTypeId: string;
      dates: string[];
      shouldBlock: boolean;
      adjustmentType: "NOMINAL" | "PERCENT";
      adjustmentValue: string;
    }
  | {
      type: "delete-rate-rule";
      id: string;
    }
  | {
      type: "payment-proof-review";
      paymentProofId: string;
      action: "approve" | "reject";
    }
  | {
      type: "cancel-order";
      bookingId: string;
      orderNo: string;
    }
  | {
      type: "submit-review-reply";
      reviewId: string;
      draft: string;
    };

export type TenantActionConfirmState = {
  title: string;
  description: string;
  confirmLabel?: string;
  payload: TenantActionConfirmPayload;
};

