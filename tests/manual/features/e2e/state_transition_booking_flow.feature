@StateTransition @WIP
# Technique: State Transition Testing
# Reference: ISTQB FL 4.5 – State Transition Testing
#
# States and valid transitions:
#
#   ┌─────────────────────────────────────────────────────────────────────┐
#   │  State               │ Trigger            │ Next state             │
#   ├─────────────────────────────────────────────────────────────────────┤
#   │  S0 – Homepage       │ Search submitted   │ S1 – Search Results    │
#   │  S1 – Search Results │ Hotel selected     │ S2 – Hotel Detail      │
#   │  S2 – Hotel Detail   │ Book Now clicked   │ S3 – Checkout          │
#   │  S3 – Checkout       │ Confirmed          │ S4 – Booking Confirmed │
#   │  S4 – Confirmed      │ Cancel booking     │ S5 – Cancelled         │
#   │  S1 – Search Results │ New search         │ S1 – Search Results    │
#   │  S3 – Checkout       │ Back button        │ S2 – Hotel Detail      │
#   └─────────────────────────────────────────────────────────────────────┘
#
# @WIP – Step definitions for booking/checkout/cancel flow to be implemented
#         once the app API and selectors for those pages are confirmed.
Feature: Hotel Booking – State Transition Through Full Booking Lifecycle
  As a QA engineer
  I want to verify every state transition in the booking flow
  So that valid transitions work and invalid ones are blocked

  Background:
    Given I am logged in as "testuser@example.com" with password "correct_password"

  # Happy path: S0 → S1 → S2 → S3 → S4 ────────────────────────────────────

  Scenario: Complete booking lifecycle – search to confirmed
    Given I am on the homepage
    When I search for hotels in "Paris" from "2026-09-01" to "2026-09-05" for "2" adults
    Then I should be in the "Search Results" state

    When I select the first available hotel
    Then I should be in the "Hotel Detail" state

    When I click the "Book Now" button
    Then I should be in the "Checkout" state

    When I confirm the booking with card "4111111111111111"
    Then I should be in the "Booking Confirmed" state
    And I should receive a confirmation number

  # Cancellation: S4 → S5 ───────────────────────────────────────────────────

  Scenario: Cancel a confirmed booking transitions to Cancelled state
    Given I have a confirmed booking with id "BK-00123"
    When I cancel the booking
    Then I should be in the "Cancelled" state
    And the booking status should show "Cancelled"

  # Back navigation: S3 → S2 ────────────────────────────────────────────────

  Scenario: Navigating back from Checkout returns to Hotel Detail
    Given I am on the "Checkout" page for hotel 321
    When I click the browser back button
    Then I should be in the "Hotel Detail" state

  # Loop: S1 → S1 ───────────────────────────────────────────────────────────

  Scenario: New search from results page stays in Search Results state
    Given I have searched for hotels in "Paris" from "2026-09-01" to "2026-09-05"
    When I search for hotels in "Rome" from "2026-10-01" to "2026-10-05" for "1" adults
    Then I should see search results for "Rome" with availability
