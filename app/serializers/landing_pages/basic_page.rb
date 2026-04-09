# frozen_string_literal: true
class LandingPages::BasicPageSerializer < ::ApplicationSerializer
  attributes :id, :parent_id, :name, :path
end
