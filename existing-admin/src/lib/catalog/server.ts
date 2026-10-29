import { prepareAuthoring, prepareCategory } from "./authoring-server";
export { getAdminDb } from "../firebase-admin";

import {
  FieldValue,
  type DocumentSnapshot,
} from "firebase-admin/firestore";
import { getAdminDb } from "../firebase-admin";
import { removeUndefinedDeep } from "../firestore-sanitize";

import type {
  Category,
  EntityType,
  Product,
  TaxonomyType,
} from "./types";

import {
  assertSlugAvailable,
  deleteSlugLockIfOwned,
  slugLockRef,
  writeSlugLock,
} from "./slugs";

export function collectionFor(type: EntityType) {
  return getAdminDb().collection(type);
}

export function nowFields() {
  return {
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function taxonomyReferenceField(
  type: TaxonomyType,
) {
  switch (type) {
    case "categories":
      return "categoryIds";

    case "occasions":
      return "occasionIds";

    case "recipients":
      return "recipientIds";

    case "collections":
      return "collectionIds";

    default:
      throw new Error(
        `Unsupported taxonomy type: ${type}`,
      );
  }
}

export async function createTaxonomy(
  type: TaxonomyType,
  data: Omit<
    Category,
    "id" | "createdAt" | "updatedAt"
  >,
) {
  const db = getAdminDb();
  const safeData = removeUndefinedDeep(data);
  const ref = db.collection(type).doc();
  const slugRef = slugLockRef(
    db,
    type,
    safeData.slug,
  );

  await db.runTransaction(async (tx) => {
    // READ
    const slugSnap = await tx.get(slugRef);

    assertSlugAvailable(
      slugSnap,
      ref.id,
    );

    if (type === "categories" && typeof safeData.parentId === "string") {
      const parentSnap = await tx.get(db.collection("categories").doc(safeData.parentId));
      if (!parentSnap.exists || parentSnap.data()?.active === false) {
        throw new Error("Parent category must exist and be active.");
      }
    }

    if (type === "categories") Object.assign(safeData, await prepareCategory(tx, db, ref.id, safeData));

    // WRITE
    writeSlugLock(
      tx,
      db,
      type,
      safeData.slug,
      ref.id,
    );

    tx.set(ref, {
      ...safeData,
      createdAt:
        FieldValue.serverTimestamp(),
      updatedAt:
        FieldValue.serverTimestamp(),
    });
  });

  return ref.id;
}

export async function updateTaxonomy(
  type: TaxonomyType,
  id: string,
  data: Partial<
    Omit<
      Category,
      "id" | "createdAt" | "updatedAt"
    >
  >,
) {
  const db = getAdminDb();
  const safeData = removeUndefinedDeep(data);
  const ref = db.collection(type).doc(id);

  await db.runTransaction(async (tx) => {
    // -----------------------------
    // READ PHASE
    // -----------------------------

    const entitySnap = await tx.get(ref);

    if (!entitySnap.exists) {
      throw new Error("Not found.");
    }

    const old =
      entitySnap.data() as Category;

    const slugChanged =
      typeof safeData.slug === "string" &&
      safeData.slug.length > 0 &&
      safeData.slug !== old.slug;

    let newSlugSnap:
      | DocumentSnapshot
      | undefined;

    let oldSlugSnap:
      | DocumentSnapshot
      | undefined;

    if (slugChanged) {
      const newSlugRef = slugLockRef(
        db,
        type,
        safeData.slug!,
      );

      const oldSlugRef = slugLockRef(
        db,
        type,
        old.slug,
      );

      // ALL SLUG READS happen before ANY writes.
      newSlugSnap = await tx.get(
        newSlugRef,
      );

      oldSlugSnap = await tx.get(
        oldSlugRef,
      );

      assertSlugAvailable(
        newSlugSnap,
        id,
      );
    }

    if (type === "categories" && Object.prototype.hasOwnProperty.call(safeData, "parentId")) {
      const parentId = safeData.parentId;

      if (typeof parentId === "string") {
        if (parentId === id) {
          throw new Error("A category cannot be its own parent.");
        }

        const visited = new Set<string>();
        let cursorId: string | null = parentId;

        while (cursorId) {
          if (cursorId === id) {
            throw new Error("A category cannot be moved under one of its own subcategories.");
          }
          if (visited.has(cursorId)) {
            throw new Error("Invalid category hierarchy detected.");
          }
          visited.add(cursorId);

          const parentRef = db.collection("categories").doc(cursorId);
          const parentSnap: DocumentSnapshot = await tx.get(parentRef);
          const parentData = parentSnap.data() as Partial<Category> | undefined;

          if (!parentSnap.exists || parentData?.active === false) {
            throw new Error("Parent category must exist and be active.");
          }

          const nextParentId: string | null =
            typeof parentData?.parentId === "string" && parentData.parentId
              ? parentData.parentId
              : null;

          cursorId = nextParentId;
        }
      }
    }

    if (type === "categories") Object.assign(safeData, await prepareCategory(tx, db, id, safeData, { ...old, id }));

    // -----------------------------
    // WRITE PHASE
    // -----------------------------

    if (slugChanged) {
      writeSlugLock(
        tx,
        db,
        type,
        safeData.slug!,
        id,
      );

      deleteSlugLockIfOwned(
        tx,
        db,
        type,
        old.slug,
        id,
        oldSlugSnap!,
      );
    }

    tx.update(ref, {
      ...safeData,
      updatedAt:
        FieldValue.serverTimestamp(),
    });
  });
}

export async function softDeleteTaxonomy(
  type: TaxonomyType,
  id: string,
) {
  const db = getAdminDb();

  await db.runTransaction(async (tx) => {
    const taxonomyRef =
      db.collection(type).doc(id);

    // READ taxonomy.
    const taxonomySnap =
      await tx.get(taxonomyRef);

    if (!taxonomySnap.exists) {
      throw new Error("Not found.");
    }

    const entity =
      taxonomySnap.data() as TaxonomyBaseLike;

    if (entity.active === false) {
      return;
    }

    const referenceField =
      taxonomyReferenceField(type);

    /*
     * Firestore permits one array membership
     * operator in this query.
     *
     * We intentionally retrieve all matching
     * products and perform the live-status check
     * in the trusted server layer.
     */
    const productsQuery = db
      .collection("products")
      .where(
        referenceField,
        "array-contains",
        id,
      );

    // READ all matching products before the
    // taxonomy write.
    const products =
      await tx.get(productsQuery);

    if (type === "categories") {
      const activeChildren = await tx.get(
        db.collection("categories").where("parentId", "==", id),
      );
      if (activeChildren.docs.some((child) => child.data().active !== false)) {
        throw new Error("Cannot archive a category while it has active subcategories.");
      }
    }

    const hasLiveReference =
      products.docs.some(
        (product) =>
          product.data().status === "live",
      );

    if (hasLiveReference) {
      throw new Error(
        "Cannot delete an active taxonomy item referenced by a live product.",
      );
    }

    if (type === "categories") await prepareCategory(tx, db, id, { active: false }, { id, ...taxonomySnap.data() } as Category);

    // WRITE
    tx.update(taxonomyRef, {
      active: false,
      updatedAt:
        FieldValue.serverTimestamp(),
    });
  });
}

type TaxonomyBaseLike = {
  active: boolean;
  slug: string;
};

export async function createProduct(
  data: Omit<
    Product,
    "id" | "createdAt" | "updatedAt"
  >,
) {
  const db = getAdminDb();
  const safeData = removeUndefinedDeep(data);

  const ref =
    db.collection("products").doc();

  const inventoryRef =
    db.collection("inventory").doc(ref.id);

  const slugRef = slugLockRef(
    db,
    "products",
    safeData.slug,
  );

  await db.runTransaction(async (tx) => {
    // READ
    const slugSnap =
      await tx.get(slugRef);

    assertSlugAvailable(
      slugSnap,
      ref.id,
    );

    const authoring = await prepareAuthoring(tx, db, ref.id, safeData);

    // WRITE
    writeSlugLock(
      tx,
      db,
      "products",
      safeData.slug,
      ref.id,
    );

    tx.set(ref, {
      ...safeData,
      ...authoring?.patch,
      createdAt:
        FieldValue.serverTimestamp(),
      updatedAt:
        FieldValue.serverTimestamp(),
    });

    if (!authoring) tx.set(
      inventoryRef,
      {
        productId: ref.id,
        quantity:
          safeData.inventory.quantity,
        reserved:
          safeData.inventory.reserved,
        sold:
          safeData.inventory.sold,
        updatedAt:
          FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    authoring?.write();
  });

  return ref.id;
}

export async function updateProduct(
  id: string,
  data: Partial<
    Omit<
      Product,
      "id" | "createdAt" | "updatedAt"
    >
  >,
) {
  const db = getAdminDb();
  const safeData = removeUndefinedDeep(data);

  const ref =
    db.collection("products").doc(id);

  const inventoryRef =
    db.collection("inventory").doc(id);

  await db.runTransaction(async (tx) => {
    // -----------------------------
    // READ PHASE
    // -----------------------------

    const entitySnap =
      await tx.get(ref);

    if (!entitySnap.exists) {
      throw new Error("Not found.");
    }

    const old =
      entitySnap.data() as Product;

    if (old.aarvika && !safeData.aarvika) throw new Error("Reload this AARVIKA-managed product before saving; authoring metadata cannot be omitted.");

    const slugChanged =
      typeof safeData.slug === "string" &&
      safeData.slug.length > 0 &&
      safeData.slug !== old.slug;

    let newSlugSnap:
      | DocumentSnapshot
      | undefined;

    let oldSlugSnap:
      | DocumentSnapshot
      | undefined;

    if (slugChanged) {
      const newSlugRef =
        slugLockRef(
          db,
          "products",
          safeData.slug!,
        );

      const oldSlugRef =
        slugLockRef(
          db,
          "products",
          old.slug,
        );

      // ALL READS before ANY writes.
      newSlugSnap =
        await tx.get(newSlugRef);

      oldSlugSnap =
        await tx.get(oldSlugRef);

      assertSlugAvailable(
        newSlugSnap,
        id,
      );
    }

    const authoring = safeData.aarvika ? await prepareAuthoring(tx, db, id, safeData as Omit<Product, "id" | "createdAt" | "updatedAt">, old) : null;

    // -----------------------------
    // WRITE PHASE
    // -----------------------------

    if (slugChanged) {
      writeSlugLock(
        tx,
        db,
        "products",
        safeData.slug!,
        id,
      );

      deleteSlugLockIfOwned(
        tx,
        db,
        "products",
        old.slug,
        id,
        oldSlugSnap!,
      );
    }

    tx.update(ref, {
      ...safeData,
      ...authoring?.patch,
      updatedAt:
        FieldValue.serverTimestamp(),
    });

    if (safeData.inventory && !authoring) {
      tx.set(
        inventoryRef,
        {
          productId: id,
          ...safeData.inventory,
          updatedAt:
            FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
    authoring?.write();
  });
}

export async function setInventory(productId: string, inventory: {quantity:number; reserved?:number; sold?:number; skuId?:string; revision?:number; reason?:string}, actorId = "legacy-admin") {
  const db = getAdminDb(), productRef=db.collection("products").doc(productId), ref=db.collection("inventory").doc(productId);
  if (!Number.isSafeInteger(inventory.quantity) || inventory.quantity<0) throw new Error("Quantity must be a non-negative whole number.");
  await db.runTransaction(async tx=>{
    const productSnap=await tx.get(productRef);
    if(!productSnap.exists) throw new Error("Not found.");
    const product=productSnap.data() as Product;
    if(product.aarvika){
      if(!inventory.skuId || !inventory.reason?.trim()) throw new Error("Select a canonical SKU and provide an adjustment reason.");
      const snapshot=await tx.get(db.collection("skus").where("productId","==",productId));
      const rows=snapshot.docs.map(d=>({id:d.id,...d.data()})) as import("@aarvika/catalogue/admin-contracts").CanonicalSkuRecord[];
      const row=rows.find(s=>s.id===inventory.skuId && product.aarvikaSkuIds?.includes(s.id));
      if(!row) throw new Error("Active SKU not found.");
      if(row.revision!==inventory.revision) throw new Error("Stock changed elsewhere. Reload before adjusting.");
      if(inventory.quantity<row.reserved) throw new Error("Quantity cannot be lower than reserved stock.");
      const active=rows.filter(s=>product.aarvikaSkuIds?.includes(s.id));
      const projection={quantity:active.reduce((n,s)=>n+(s.id===row.id?inventory.quantity:s.quantity),0),reserved:active.reduce((n,s)=>n+s.reserved,0),sold:rows.reduce((n,s)=>n+s.sold,0)};
      tx.update(db.collection("skus").doc(row.id),{quantity:inventory.quantity,revision:row.revision+1,updatedAt:FieldValue.serverTimestamp()});
      tx.update(productRef,{inventory:projection,...(product.variants.length?{variants:product.variants.map((variant,index)=>`sku-${productId}-${variant.id||`variant-${index+1}`}`===row.id?{...variant,quantity:inventory.quantity}:variant)}:{}),"aarvika.revision":product.aarvika.revision+1,updatedAt:FieldValue.serverTimestamp()});
      tx.set(ref,{productId,...projection,projectionOf:"skus",updatedAt:FieldValue.serverTimestamp()},{merge:true});
      tx.create(db.collection("inventory_adjustments").doc(),{productId,skuId:row.id,before:row.quantity,after:inventory.quantity,reason:inventory.reason.trim(),actorId,createdAt:FieldValue.serverTimestamp()});
    }else{
      const existing=await tx.get(ref), current=existing.data()??product.inventory;
      const reserved=Number(current.reserved??0), sold=Number(current.sold??0);
      if(inventory.quantity<reserved) throw new Error("Quantity cannot be lower than reserved stock.");
      const next={quantity:inventory.quantity,reserved,sold};
      tx.set(ref,{productId,...next,updatedAt:FieldValue.serverTimestamp()},{merge:true});
      tx.update(productRef,{inventory:next,updatedAt:FieldValue.serverTimestamp()});
    }
  });
}
