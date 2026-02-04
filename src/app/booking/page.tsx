"use client";

import { useEffect, useState } from "react";

/* ======================
 * Types (ERD-aligned)
 * ====================== */
interface Booking {
  id: string;
  orderNo: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  units: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

/* ======================
 * Page Component
 * ====================== */
export default function BookingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    propertyId: "",
    roomTypeId: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    rooms: 1,
  });

  /* ======================
   * Fetch bookings
   * ====================== */
  const fetchBookings = async () => {
    const res = await fetch("http://localhost:3000/bookings");
    const json = await res.json();
    setBookings(json.data ?? []);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  /* ======================
   * Create booking
   * ====================== */
  const createBooking = async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Failed to create booking");
      }

      await fetchBookings();
      alert("Booking created");
    } catch (err) {
      alert("Error creating booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Booking</h1>

      {/* ======================
       * Create Booking Form
       * ====================== */}
      <section style={{ marginBottom: 32 }}>
        <h2>Create Booking</h2>

        <input
          placeholder="Property ID"
          value={form.propertyId}
          onChange={(e) =>
            setForm({ ...form, propertyId: e.target.value })
          }
        />

        <input
          placeholder="Room Type ID"
          value={form.roomTypeId}
          onChange={(e) =>
            setForm({ ...form, roomTypeId: e.target.value })
          }
        />

        <input
          type="date"
          value={form.checkIn}
          onChange={(e) =>
            setForm({ ...form, checkIn: e.target.value })
          }
        />

        <input
          type="date"
          value={form.checkOut}
          onChange={(e) =>
            setForm({ ...form, checkOut: e.target.value })
          }
        />

        <input
          type="number"
          min={1}
          value={form.guests}
          onChange={(e) =>
            setForm({ ...form, guests: Number(e.target.value) })
          }
        />

        <input
          type="number"
          min={1}
          value={form.rooms}
          onChange={(e) =>
            setForm({ ...form, rooms: Number(e.target.value) })
          }
        />

        <button disabled={loading} onClick={createBooking}>
          {loading ? "Creating..." : "Create Booking"}
        </button>
      </section>

      {/* ======================
       * Booking List
       * ====================== */}
      <section>
        <h2>My Bookings</h2>

        {bookings.length === 0 && <p>No bookings yet</p>}

        {bookings.map((b) => (
          <div
            key={b.id}
            style={{
              border: "1px solid #ddd",
              padding: 12,
              marginBottom: 12,
            }}
          >
            <p>
              <strong>Order:</strong> {b.orderNo}
            </p>
            <p>
              <strong>Date:</strong> {b.checkIn} → {b.checkOut}
            </p>
            <p>
              <strong>Guests:</strong> {b.guests}
            </p>
            <p>
              <strong>Rooms:</strong> {b.units}
            </p>
            <p>
              <strong>Status:</strong> {b.status}
            </p>
            <p>
              <strong>Total:</strong> {b.totalAmount}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
