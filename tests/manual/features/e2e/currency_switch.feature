@Regression @LocalUI
# Priority: Medium
Feature: Currency Selection

  Background:
    Given I open the Booking.com homepage
    And I have searched for hotels in "London" from "2026-08-01" to "2026-08-07"

  Scenario Outline: Currency switch affects prices
    When I change currency to "<currency>"
    Then prices should be displayed in "<symbol>"

    Examples:
      | currency | symbol |
      | USD      | $      |
      | EUR      | €      |
      | GBP      | £      |
