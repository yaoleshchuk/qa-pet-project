@API @Regression
# Priority: Medium
Feature: Hotel reviews

  Scenario: Get reviews for hotel
    When I send GET request to /api/hotel/321/reviews
    Then response should contain list of reviews with user names and ratings
