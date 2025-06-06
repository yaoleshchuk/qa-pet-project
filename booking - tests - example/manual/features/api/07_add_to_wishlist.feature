@API @Acceptance
# Priority: High
Feature: Add to wishlist

  Scenario: Add hotel to wishlist by ID
    When I send POST request to /api/wishlist with hotel_id=123
    Then response status code should be 200
    And wishlist should contain hotel 123
