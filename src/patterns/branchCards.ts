/** 
 * Factory Method Pattern implementation on creating branch cards based on branch's audit status.
 * This enables different branch audit statuses to produce different card types.
*/

// Product Interface: declares the instructions that all concrete products must implement.
export interface BranchCard {
  id: string;
  name: string;
  revenue: number;
  auditStatus: string;
  grillStatus: { items: any[] };
  latestSale: any;
  lastUpdate: string;
}

// Card View Configuration: helper for UI rendering
export type CardViewType = 'active' | 'ready_for_audit' | 'audited';

export interface CardViewConfig {
  viewType: CardViewType;
  revenueLabel: string;
  revenueClass: string;
  timestampPrefix: string;
  showGrillStatus: boolean;
  showActivityBanner: boolean;
  cardBorderClass: string;
}

// Maps audit status to UI configuration without instantiating card classes
export function resolveCardView(status: string): CardViewConfig {
  const map: Record<string, CardViewConfig> = {
    active: {
      viewType: 'active',
      revenueLabel: 'Revenue',
      revenueClass: 'text-[#D32F2F]',
      timestampPrefix: '',
      showGrillStatus: true,
      showActivityBanner: true,
      cardBorderClass: 'border border-gray-200',
    },
    ready_for_audit: {
      viewType: 'ready_for_audit',
      revenueLabel: 'Final Revenue',
      revenueClass: 'text-emerald-600',
      timestampPrefix: 'Closed at',
      showGrillStatus: false,
      showActivityBanner: false,
      cardBorderClass: 'border-2 border-emerald-400',
    },
    audited: {
      viewType: 'audited',
      revenueLabel: 'Final Revenue',
      revenueClass: 'text-gray-400',
      timestampPrefix: 'Audited at',
      showGrillStatus: false,
      showActivityBanner: false,
      cardBorderClass: 'border border-gray-200',
    },
  };
  return map[status?.toLowerCase()] ?? map['active'];
}

// Concrete Products
export class ActiveBranchCard implements BranchCard {
  readonly viewType: CardViewType = 'active';
  constructor(
    public id: string, public name: string, public revenue: number,
    public auditStatus: string, public grillStatus: any,
    public latestSale: any, public lastUpdate: string
  ) {}
}

export class ReadyForAuditBranchCard implements BranchCard {
  readonly viewType: CardViewType = 'ready_for_audit';
  constructor(
    public id: string, public name: string, public revenue: number,
    public auditStatus: string, public grillStatus: any,
    public latestSale: any, public lastUpdate: string
  ) {}
}

export class AuditedBranchCard implements BranchCard {
  readonly viewType: CardViewType = 'audited';
  constructor(
    public id: string, public name: string, public revenue: number,
    public auditStatus: string, public grillStatus: any,
    public latestSale: any, public lastUpdate: string
  ) {}
}

// Shared Data Shape
interface CardData {
  id: string;
  branch_name: string;
  last_audit_status: string;
  created_at: string;
  updated_at?: string;
}

// Creator (abstract base class): Declares the factory method; subclasses decide which product to build.
export abstract class BranchCardCreator {
  // Factory Method (overridden by subclasses)
  abstract createCard(
    branch: CardData,
    sales: any[],
    grillData: any[]
  ): BranchCard;

  // Protected helper: computes revenue from a sales array.
  protected computeRevenue(sales: any[]): number {
    return sales?.reduce((sum, s) => sum + (Number(s.sold_price) || 0), 0) || 0;
  }

  // Protected helper: maps raw grill rows into the grillStatus shape.
  protected buildGrillStatus(grillData: any[]): { items: any[] } {
    return {
      items: grillData?.map((g: any) => ({
        product_name: g.products?.product_name,
        current_count: Number(g.current_count || 0),
      })) || [],
    };
  }

  // Protected helper: extracts the latest sale from an ordered array.
  protected buildLatestSale(sales: any[]): any | null {
    const latest = sales?.[0];
    return latest
      ? { product_name: latest.product_name_at_sale, sold_at: latest.sold_at }
      : null;
  }
}

// Concrete Creators (one per audit status): Each overrides createCard() and returns its own product type.
export class ActiveBranchCreator extends BranchCardCreator {
  createCard(branch: CardData, sales: any[], grillData: any[]): ActiveBranchCard {
    return new ActiveBranchCard(
      branch.id,
      branch.branch_name,
      this.computeRevenue(sales),
      'active',
      this.buildGrillStatus(grillData),
      this.buildLatestSale(sales),
      branch.updated_at || branch.created_at,
    );
  }
}

export class ReadyForAuditBranchCreator extends BranchCardCreator {
  createCard(branch: CardData, sales: any[], grillData: any[]): ReadyForAuditBranchCard {
    return new ReadyForAuditBranchCard(
      branch.id,
      branch.branch_name,
      this.computeRevenue(sales),
      'ready_for_audit',
      this.buildGrillStatus(grillData),
      this.buildLatestSale(sales),
      branch.updated_at || branch.created_at,
    );
  }
}

export class AuditedBranchCreator extends BranchCardCreator {
  createCard(branch: CardData, sales: any[], _grillData: any[]): AuditedBranchCard {
    return new AuditedBranchCard(
      branch.id,
      branch.branch_name,
      this.computeRevenue(sales),
      'audited',
      { items: [] },   
      null,           
      branch.updated_at || branch.created_at,
    );
  }
}

// Creator Resolver: selects the right creator by status. Keeps call sites in dashboardRoutes clean.

// Private Registry: maps audit status to pre-instantiated creator instances
const creatorRegistry: Record<string, BranchCardCreator> = {
  active:          new ActiveBranchCreator(),
  ready_for_audit: new ReadyForAuditBranchCreator(),
  audited:         new AuditedBranchCreator(),
};

export function getBranchCreator(status: string): BranchCardCreator {
  return creatorRegistry[status?.toLowerCase()] ?? creatorRegistry['active'];
}