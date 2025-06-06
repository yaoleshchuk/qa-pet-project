Feature: Booking.com E2E User Flows

  Background:
    Given I open the Booking.com homepage

  Scenario: User logs in with valid credentials
    When I click on the "Sign in" button
    And I enter email "testuser@example.com" and click "Continue"
    And I enter password "correct_password" and click "Sign in"
    Then I should be redirected to the user dashboard

  Scenario Outline: Search for hotels in different cities with date combinations
    When I search for hotels in "<city>" from "<checkin>" to "<checkout>" for "<adults>" adults
    Then I should see search results for "<city>" with availability

    Examples:
      | city       | checkin     | checkout    | adults |
      | Paris      | 2025-07-01  | 2025-07-05  | 2      |
      | New York   | 2025-08-10  | 2025-08-15  | 1      |
      | Tokyo      | 2025-09-20  | 2025-09-25  | 3      |

  Scenario: Filter search results by star rating
    Given I have searched for hotels in "Barcelona" from "2025-07-10" to "2025-07-15"
    When I apply filter "5 stars"
    Then I should see only 5-star hotel listings

  Scenario: Sort results by lowest price
    Given I have searched for hotels in "London" from "2025-08-01" to "2025-08-07"
    When I sort results by "Price (lowest first)"
    Then the first result should have the lowest price

  Scenario: Add a hotel to favorites after login
    Given I am logged in as "testuser@example.com" with password "correct_password"
    And I have searched for hotels in "Rome" from "2025-09-10" to "2025-09-15"
    When I click "Save" on the first hotel
    Then the hotel should be added to my favorites
