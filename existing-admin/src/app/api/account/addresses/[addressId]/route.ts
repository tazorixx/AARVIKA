import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, verifyBearerToken } from "@/lib/firebase-admin";

function cleanString(value: unknown, max = 160) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function serializeAddress(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    label: cleanString(data.label, 40),
    name: cleanString(data.name, 100),
    phone: cleanString(data.phone, 20),
    addressLine: cleanString(data.addressLine, 240),
    city: cleanString(data.city, 80),
    state: cleanString(data.state, 80),
    pincode: cleanString(data.pincode, 10),
    landmark: cleanString(data.landmark, 120),
    isDefault: data.isDefault === true,
  };
}

async function getAddressRef(request: Request, addressId: string) {
  const { uid } = await verifyBearerToken(request);
  return getAdminDb().collection("users").doc(uid).collection("addresses").doc(addressId);
}

export async function PATCH(request: Request, context: { params: Promise<{ addressId: string }> }) {
  try {
    const { addressId } = await context.params;
    const ref = await getAddressRef(request, addressId);
    const current = await ref.get();
    if (!current.exists) return NextResponse.json({ error: "Address not found." }, { status: 404 });

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    const fields: Array<[string, number]> = [["label", 40], ["name", 100], ["phone", 20], ["addressLine", 240], ["city", 80], ["state", 80], ["pincode", 10], ["landmark", 120]];
    for (const [field, max] of fields) {
      if (body[field] !== undefined) updates[field] = cleanString(body[field], max);
    }
    if (updates.pincode !== undefined && !/^\d{6}$/.test(String(updates.pincode))) {
      return NextResponse.json({ error: "Enter a valid 6-digit pincode." }, { status: 400 });
    }
    if (body.isDefault === true) {
      const db = getAdminDb();
      const parent = ref.parent;
      const snapshot = await parent.get();
      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.update(doc.ref, { isDefault: doc.id === addressId, updatedAt: FieldValue.serverTimestamp() }));
      if (Object.keys(updates).length) batch.update(ref, { ...updates, updatedAt: FieldValue.serverTimestamp() });
      await batch.commit();
    } else {
      if (body.isDefault === false) updates.isDefault = false;
      updates.updatedAt = FieldValue.serverTimestamp();
      await ref.update(updates);
    }

    const updated = await ref.get();
    return NextResponse.json({ address: serializeAddress(updated.id, updated.data() || {}) });
  } catch (error) {
    console.error("PATCH /api/account/addresses/[addressId] failed", error);
    return NextResponse.json({ error: "Unable to update this address right now." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ addressId: string }> }) {
  try {
    const { addressId } = await context.params;
    const ref = await getAddressRef(request, addressId);
    const current = await ref.get();
    if (!current.exists) return NextResponse.json({ error: "Address not found." }, { status: 404 });

    const wasDefault = current.data()?.isDefault === true;
    await ref.delete();

    if (wasDefault) {
      const replacement = await ref.parent.limit(1).get();
      if (!replacement.empty) await replacement.docs[0].ref.update({ isDefault: true, updatedAt: FieldValue.serverTimestamp() });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/account/addresses/[addressId] failed", error);
    return NextResponse.json({ error: "Unable to remove this address right now." }, { status: 500 });
  }
}
