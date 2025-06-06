@API @Acceptance
# Priority: Medium
Feature: Remove from wishlist

  Scenario: Remove hotel from wishlist
    When I send DELETE request to /api/wishlist/123
    Then response status code should be 200
    And hotel 123 should no longer be in the wishlist
