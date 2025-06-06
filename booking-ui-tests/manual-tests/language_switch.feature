@Acceptance @Smoke
# Priority: High
Feature: Language Selection

  Background:
    Given I open the Booking.com homepage

  Scenario Outline: Language switch on homepage
    When I select language "<language>"
    Then the site should display text "<expectedText>"

    Examples:
      | language | expectedText |
      | English  | Stays        |
      | Español  | Alojamientos |
      | Deutsch  | Unterkünfte  |
