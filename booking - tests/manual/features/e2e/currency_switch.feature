@Regression
# Priority: Medium
Feature: Currency Selection

  Background:
    Given I open the Booking.com homepage

  Scenario Outline: Currency switch affects prices
    When I change currency to "<currency>"
    Then prices should be displayed in "<symbol>"

    Examples:
      | currency | symbol |
      | USD      | $      |
      | EUR      | €      |
      | GBP      | £      |
