@E2E
Feature: Booking.com E2E User Flows
  As a traveller
  I want to search, filter, sort and save hotels on Booking.com
  So that I can plan and book my accommodation efficiently

  Background:
    Given I open the Booking.com homepage

  @Acceptance @Smoke
  Scenario: User logs in with valid credentials
    When I click on the "Sign in" button
    And I enter email "testuser@example.com" and click "Continue"
    And I enter password "correct_password" and click "Sign in"
    Then I should be redirected to the user dashboard

  @Acceptance @Regression
  Scenario Outline: Search for hotels in different cities with date combinations
    When I search for hotels in "<city>" from "<checkin>" to "<checkout>" for "<adults>" adults
    Then I should see search results for "<city>" with availability

    Examples:
      | city      | checkin     | checkout    | adults |
      | Paris     | 2026-07-01  | 2026-07-05  | 2      |
      | New York  | 2026-08-10  | 2026-08-15  | 1      |
      | Tokyo     | 2026-09-20  | 2026-09-25  | 3      |

  @Smoke @Regression
  Scenario: Filter search results by star rating
    Given I have searched for hotels in "Barcelona" from "2026-07-10" to "2026-07-15"
    When I apply filter "5 stars"
    Then I should see only 5-star hotel listings

  @Regression
  Scenario: Sort results by lowest price
    Given I have searched for hotels in "London" from "2026-08-01" to "2026-08-07"
    When I sort results by "Price (lowest first)"
    Then the first result should have the lowest price

  @Smoke
  Scenario: Save a hotel to favourites after login
    Given I am logged in as "testuser@example.com" with password "correct_password"
    And I have searched for hotels in "Rome" from "2026-09-10" to "2026-09-15"
    When I click "Save" on the first hotel
    Then the hotel should be added to my favorites
