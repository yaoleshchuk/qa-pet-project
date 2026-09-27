@API @Regression
# Priority: Medium
Feature: Price filtering

  Scenario: Hotels within selected price range
    When I send GET request to /api/hotels?city=Paris&min_price=100&max_price=300
    Then the response status code should be 200
    And response should only include hotels with price between 100 and 300
