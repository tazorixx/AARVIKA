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
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? null,
  };
}

async function getUid(request: Request) {
  const { uid } = await verifyBearerToken(request);
  return uid;
}

export async function GET(request: Request) {
  try {
    const uid = await getUid(request);
    const snapshot = await getAdminDb().collection("users").doc(uid).collection("addresses").get();
    const addresses = snapshot.docs
      .map((doc) => serializeAddress(doc.id, doc.data()))
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || (b.updatedAt || "").localeCompare(a.updatedAt || ""));

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("GET /api/account/addresses failed", error);
    return NextResponse.json({ error: "Unable to load your saved addresses." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const uid = await getUid(request);
    const body = await request.json();
    const address = {
      label: cleanString(body.label, 40) || "Home",
      name: cleanString(body.name, 100),
      phone: cleanString(body.phone, 20),
      addressLine: cleanString(body.addressLine, 240),
      city: cleanString(body.city, 80),
      state: cleanString(body.state, 80),
      pincode: cleanString(body.pincode, 10),
      landmark: cleanString(body.landmark, 120),
    };

    if (!address.name || !address.phone || !address.addressLine || !address.city || !address.state || !/^\d{6}$/.test(address.pincode)) {
      return NextResponse.json({ error: "Please enter all required address details and a valid 6-digit pincode." }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.collection("users").doc(uid).collection("addresses").doc();
    const existing = await ref.parent.get();
    const shouldDefault = body.isDefault === true || existing.empty;
    const batch = db.batch();

    if (shouldDefault) {
      existing.docs.forEach((doc) => batch.update(doc.ref, { isDefault: false, updatedAt: FieldValue.serverTimestamp() }));
    }

    batch.set(ref, {
      ...address,
      isDefault: shouldDefault,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();

    return NextResponse.json({ address: serializeAddress(ref.id, { ...address, isDefault: shouldDefault }) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/account/addresses failed", error);
    return NextResponse.json({ error: "Unable to save this address right now." }, { status: 500 });
  }
}
