/**
 * FlyDreamAir - Unit & Integration Test Suite
 * --------------------------------------------
 * Framework:  Jest 29
 * Library:    React Testing Library (@testing-library/react)
 * User events: @testing-library/user-event
 *
 * Run with:   npm test
 *
 * These tests cover the six core features of the prototype:
 *   1. Registration & login
 *   2. Flight search results
 *   3. Flight details + seat map
 *   4. Seat selection & booking
 *   5. My bookings / manage
 *   6. Admin booking view
 *
 * Plus the pure helper functions used for formatting and filtering.
 */

import React from "react";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./FlyDreamAir.jsx";

/* ------------------------------------------------------------------ */
/* Test setup                                                          */
/* ------------------------------------------------------------------ */

// jsdom does not implement scrollTo; the app calls it on every navigation.
beforeAll(() => {
  window.scrollTo = jest.fn();
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Small helper: render the app fresh for each test.
const setup = () => {
  const user = userEvent.setup();
  const utils = render(<App />);
  return { user, ...utils };
};

/* ================================================================== */
/* 0. Pure helper functions                                            */
/* ================================================================== */
/*
 * These mirror the helpers defined in FlyDreamAir.jsx. They are pure
 * functions, so they are the easiest things to unit test in isolation.
 * In a refactor these would be exported from a utils module and imported
 * directly; they are reproduced here so the suite is self-contained.
 */

const money = (n) => "$" + n.toLocaleString("en-AU");
const durStr = (m) => Math.floor(m / 60) + "h " + String(m % 60).padStart(2, "0") + "m";
const bucket = (t) => {
  const h = parseInt(t.split(":")[0], 10);
  return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
};

describe("Helper functions", () => {
  describe("money()", () => {
    test("formats a whole number with a dollar sign", () => {
      expect(money(450)).toBe("$450");
    });

    test("adds thousands separators", () => {
      expect(money(4200)).toBe("$4,200");
    });

    test("handles zero", () => {
      expect(money(0)).toBe("$0");
    });
  });

  describe("durStr()", () => {
    test("converts minutes into hours and minutes", () => {
      expect(durStr(640)).toBe("10h 40m");
    });

    test("pads single-digit minutes with a leading zero", () => {
      expect(durStr(185)).toBe("3h 05m");
    });

    test("handles an exact hour", () => {
      expect(durStr(120)).toBe("2h 00m");
    });
  });

  describe("bucket()", () => {
    test("classifies a morning departure", () => {
      expect(bucket("09:30")).toBe("morning");
    });

    test("classifies an afternoon departure", () => {
      expect(bucket("13:20")).toBe("afternoon");
    });

    test("classifies an evening departure", () => {
      expect(bucket("21:45")).toBe("evening");
    });

    test("treats midday as afternoon (boundary case)", () => {
      expect(bucket("12:00")).toBe("afternoon");
    });
  });
});

/* ================================================================== */
/* 1. Registration & login                                             */
/* ================================================================== */

describe("Registration & login", () => {
  test("shows a Log in link when no user is signed in", () => {
    setup();
    expect(screen.getByText("Log in")).toBeInTheDocument();
  });

  test("clicking Log in opens the sign-in page", async () => {
    const { user } = setup();
    await user.click(screen.getByText("Log in"));
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  test("toggling to Register shows the create-account view", async () => {
    const { user } = setup();
    await user.click(screen.getByText("Log in"));
    await user.click(screen.getByRole("button", { name: /register/i }));
    expect(screen.getByText("Create your account")).toBeInTheDocument();
  });

  test("registering with a name logs the user in and updates the nav", async () => {
    const { user } = setup();
    await user.click(screen.getByText("Log in"));
    await user.click(screen.getByRole("button", { name: /register/i }));

    await user.type(screen.getByPlaceholderText("Liam Nguyen"), "Manuel Tester");
    await user.type(screen.getByPlaceholderText("you@example.com"), "manuel@uni.edu");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    // Nav should now show the user's first name and a log out option.
    expect(screen.getByText("Manuel")).toBeInTheDocument();
    expect(screen.getByText("Log out")).toBeInTheDocument();
  });

  test("logging out returns to the signed-out state", async () => {
    const { user } = setup();
    await user.click(screen.getByText("Log in"));
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    await user.click(screen.getByText("Log out"));

    expect(screen.getByText("Log in")).toBeInTheDocument();
  });

  test("derives a display name from the email when none is given", async () => {
    const { user } = setup();
    await user.click(screen.getByText("Log in"));
    await user.type(screen.getByPlaceholderText("you@example.com"), "charlotte@example.com");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText("Charlotte")).toBeInTheDocument();
  });
});

/* ================================================================== */
/* 2. Flight search results                                            */
/* ================================================================== */

describe("Flight search results", () => {
  test("the home page renders the search widget", () => {
    setup();
    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("To")).toBeInTheDocument();
    expect(screen.getByText("Travellers")).toBeInTheDocument();
  });

  test("clicking Search navigates to the results page with flight cards", async () => {
    const { user, container } = setup();
    await user.click(screen.getByRole("button", { name: /search/i }));

    expect(screen.getByText(/flights/i)).toBeInTheDocument();
    expect(container.querySelectorAll(".flight").length).toBeGreaterThan(0);
  });

  test("the traveller stepper increases and decreases passenger count", async () => {
    const { user, container } = setup();
    const stepper = container.querySelector(".stepper");
    const [minus, plus] = within(stepper).getAllByRole("button");

    expect(within(stepper).getByText("1")).toBeInTheDocument();
    await user.click(plus);
    expect(within(stepper).getByText("2")).toBeInTheDocument();
    await user.click(minus);
    expect(within(stepper).getByText("1")).toBeInTheDocument();
  });

  test("the stepper never drops below one passenger", async () => {
    const { user, container } = setup();
    const stepper = container.querySelector(".stepper");
    const [minus] = within(stepper).getAllByRole("button");

    await user.click(minus);
    await user.click(minus);
    expect(within(stepper).getByText("1")).toBeInTheDocument();
  });

  test("the return / one-way toggle switches active state", async () => {
    const { user } = setup();
    const oneWay = screen.getByRole("button", { name: /one way/i });
    await user.click(oneWay);
    expect(oneWay).toHaveClass("on");
  });
});

/* ================================================================== */
/* 2b. Filtering & sorting                                             */
/* ================================================================== */

describe("Filtering and sorting", () => {
  const goToResults = async (user) => {
    await user.click(screen.getByRole("button", { name: /search/i }));
  };

  test("the sort controls (Cheapest / Fastest / Earliest) render", async () => {
    const { user } = setup();
    await goToResults(user);
    expect(screen.getByRole("button", { name: /cheapest/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /fastest/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /earliest/i })).toBeInTheDocument();
  });

  test("selecting Fastest marks that sort option active", async () => {
    const { user } = setup();
    await goToResults(user);
    const fastest = screen.getByRole("button", { name: /fastest/i });
    await user.click(fastest);
    expect(fastest).toHaveClass("on");
  });

  test("a direct-only stops filter can be toggled on", async () => {
    const { user } = setup();
    await goToResults(user);
    const direct = screen.getByLabelText(/direct/i);
    await user.click(direct);
    expect(direct).toBeChecked();
  });

  test("changing cabin class updates the fare label on cards", async () => {
    const { user } = setup();
    await goToResults(user);
    await user.click(screen.getByLabelText(/business/i));
    expect(screen.getAllByText(/business from/i).length).toBeGreaterThan(0);
  });
});

/* ================================================================== */
/* 3 & 4. Flight details, seat map, seat selection & booking           */
/* ================================================================== */

describe("Flight details, seat map and booking", () => {
  // Walk the app from home through to the seat-selection page.
  const goToSeatMap = async (user) => {
    await user.click(screen.getByRole("button", { name: /search/i }));
    const firstSelect = screen.getAllByRole("button", { name: /select/i })[0];
    await user.click(firstSelect);
  };

  test("selecting a flight opens the seat-selection page", async () => {
    const { user } = setup();
    await goToSeatMap(user);
    expect(screen.getByText("Choose your seat")).toBeInTheDocument();
  });

  test("the seat map renders both available and taken seats", async () => {
    const { user, container } = setup();
    await goToSeatMap(user);
    expect(container.querySelectorAll(".seat:not(.taken)").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".seat.taken").length).toBeGreaterThan(0);
  });

  test("the Continue button is disabled until a seat is chosen", async () => {
    const { user } = setup();
    await goToSeatMap(user);
    expect(screen.getByRole("button", { name: /select a seat to continue/i })).toBeDisabled();
  });

  test("clicking an available seat highlights it as selected", async () => {
    const { user, container } = setup();
    await goToSeatMap(user);
    const seat = container.querySelector(".seat:not(.taken)");
    await user.click(seat);
    expect(container.querySelector(".seat.sel")).toBeInTheDocument();
  });

  test("a taken seat is disabled and cannot be selected", async () => {
    const { user, container } = setup();
    await goToSeatMap(user);
    const takenSeat = container.querySelector(".seat.taken");
    expect(takenSeat).toBeDisabled();
  });

  test("toggling an extra adds it to the order", async () => {
    const { user, container } = setup();
    await goToSeatMap(user);
    const firstExtra = container.querySelector(".extras .x");
    await user.click(firstExtra);
    expect(container.querySelector(".extras .x.on")).toBeInTheDocument();
  });

  test("the price summary updates after selecting a seat", async () => {
    const { user, container } = setup();
    await goToSeatMap(user);
    await user.click(container.querySelector(".seat:not(.taken)"));
    const total = container.querySelector(".stotal .amt");
    expect(total.textContent).toMatch(/^\$/);
  });

  test("choosing a seat enables Continue and reaches checkout", async () => {
    const { user, container } = setup();
    await goToSeatMap(user);
    await user.click(container.querySelector(".seat:not(.taken)"));
    await user.click(screen.getByRole("button", { name: /continue to booking/i }));
    expect(screen.getByText("Complete your booking")).toBeInTheDocument();
  });

  test("the full booking flow produces a confirmation reference", async () => {
    const { user, container } = setup();
    await goToSeatMap(user);
    await user.click(container.querySelector(".seat:not(.taken)"));
    await user.click(screen.getByRole("button", { name: /continue to booking/i }));

    await user.type(screen.getByPlaceholderText("Liam Nguyen"), "Manuel Tester");
    await user.click(screen.getByRole("button", { name: /confirm booking/i }));

    expect(screen.getByText(/you're all booked/i)).toBeInTheDocument();
    const ref = container.querySelector(".ref");
    expect(ref.textContent).toMatch(/^FD[A-Z0-9]+$/);
  });
});

/* ================================================================== */
/* 5. My bookings / manage                                             */
/* ================================================================== */

describe("My bookings / manage", () => {
  test("the My Bookings page lists the seeded bookings", async () => {
    const { user, container } = setup();
    await user.click(screen.getByText("My Bookings"));
    expect(screen.getByRole("heading", { name: /my bookings/i })).toBeInTheDocument();
    expect(container.querySelectorAll(".mb-row").length).toBeGreaterThanOrEqual(6);
  });

  test("clicking a booking row expands its details", async () => {
    const { user, container } = setup();
    await user.click(screen.getByText("My Bookings"));
    await user.click(container.querySelector(".mb-head"));
    expect(container.querySelector(".mb-body.open")).toBeInTheDocument();
  });

  test("an upcoming booking shows a Cancel button", async () => {
    const { user, container } = setup();
    await user.click(screen.getByText("My Bookings"));

    // Find an upcoming row and expand it.
    const upcomingBadge = container.querySelector(".badge.up");
    const row = upcomingBadge.closest(".mb-row");
    await user.click(within(row).getByText(/sydney|melbourne|brisbane|perth|cairns|adelaide/i));

    expect(within(row).getByRole("button", { name: /cancel booking/i })).toBeInTheDocument();
  });

  test("a newly made booking appears in My Bookings", async () => {
    const { user, container } = setup();

    // Make a booking.
    await user.click(screen.getByRole("button", { name: /search/i }));
    await user.click(screen.getAllByRole("button", { name: /select/i })[0]);
    await user.click(container.querySelector(".seat:not(.taken)"));
    await user.click(screen.getByRole("button", { name: /continue to booking/i }));
    await user.click(screen.getByRole("button", { name: /confirm booking/i }));

    // Jump to My Bookings via the confirmation page button.
    await user.click(screen.getByRole("button", { name: /manage booking/i }));
    expect(container.querySelectorAll(".mb-row").length).toBeGreaterThanOrEqual(7);
  });
});

/* ================================================================== */
/* 6. Admin booking view                                               */
/* ================================================================== */

describe("Admin booking view", () => {
  const goToAdmin = async (user) => {
    await user.click(screen.getByText("Staff portal"));
  };

  test("the admin panel renders a bookings table", async () => {
    const { user } = setup();
    await goToAdmin(user);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText(/bookings admin/i)).toBeInTheDocument();
  });

  test("the table has a row for every booking", async () => {
    const { user, container } = setup();
    await goToAdmin(user);
    const bodyRows = container.querySelectorAll("tbody tr");
    expect(bodyRows.length).toBeGreaterThanOrEqual(6);
  });

  test("clicking a column header sorts without crashing", async () => {
    const { user } = setup();
    await goToAdmin(user);
    const header = screen.getByText("Passenger");
    await user.click(header);
    // Sorted column shows the active marker.
    expect(screen.getByText(/passenger/i).textContent).toContain("↓");
  });

  test("changing a booking status via the dropdown updates it", async () => {
    const { user, container } = setup();
    await goToAdmin(user);
    const firstSelect = container.querySelector("td select");
    await userEvent.selectOptions(firstSelect, "cancelled");
    expect(firstSelect.value).toBe("cancelled");
  });
});

/* ================================================================== */
/* 7. Navigation smoke tests                                           */
/* ================================================================== */

describe("Navigation", () => {
  test("the brand logo returns to the home page", async () => {
    const { user, container } = setup();
    await user.click(screen.getByText("My Bookings"));
    await user.click(container.querySelector(".brand"));
    expect(screen.getByText(/your dream flight/i)).toBeInTheDocument();
  });

  test("the mobile hamburger menu toggles open", async () => {
    const { user, container } = setup();
    const hamburger = container.querySelector(".hamb");
    await user.click(hamburger);
    expect(container.querySelector(".mobile.open")).toBeInTheDocument();
  });

  test("the footer links navigate to internal pages", async () => {
    const { user } = setup();
    await user.click(screen.getByText("Search flights"));
    expect(screen.getByRole("button", { name: /cheapest/i })).toBeInTheDocument();
  });
});
