@Acceptance @Regression
# Priority: Medium
Feature: Search Filters

  Scenario: User applies multiple filters on hotel results
    Given I have searched for hotels in "Paris" from "2025-08-01" to "2025-08-05"
    When I apply filters: "Free WiFi", "Breakfast included", "4 stars"
    Then the results should only include hotels matching those filters
